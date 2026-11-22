import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import type { PoolClient } from 'pg'
import { CommerceAccess, type CommerceRole, type StaffRole } from './commerce-access.js'
import { CommerceDatabase } from './commerce-database.js'

type Identity = { kind: 'cliente' | 'personal' | 'solicitante'; name: string; customer: number | null }
type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'
type RequestRow = {
  id: number
  subject: string
  branch: number
  role: StaffRole
  status: RequestStatus
}

function approvingRole(role: StaffRole): CommerceRole {
  return role === 'jefe' ? 'supervisor' : 'jefe'
}

@Injectable()
export class CommerceStaff {
  constructor(
    @Inject(CommerceAccess) private readonly access: CommerceAccess,
    @Inject(CommerceDatabase) private readonly database: CommerceDatabase,
  ) {}

  identity(subject: string) {
    return this.database.transaction(async db => {
      const row = (await db.query<Identity>(
        'SELECT kind, name, customer FROM commerce.identity WHERE subject = $1', [subject],
      )).rows[0]
      const sucursales = await this.access.branches(db, subject)
      const tipo = !row || row.kind === 'solicitante' ? 'sin_registro' : row.kind
      return { tipo, nombre: row?.name ?? null, sucursales }
    })
  }

  registerCustomer(subject: string, name: string, email: string) {
    return this.database.transaction(async db => {
      const profile = await this.lockProfile(db, subject, name, email)
      if (profile.kind === 'cliente') return { id: profile.customer }
      if (profile.kind === 'personal' || (await db.query(
        "SELECT 1 FROM commerce.staff_request WHERE subject = $1 AND status = 'pendiente'", [subject],
      )).rowCount) throw new ConflictException()
      const personal = await db.query<{ id_cliente: number }>(`INSERT INTO public.cliente (id_cliente, nombres, correo)
        VALUES (nextval('practica_api.identificador'), $1, $2) RETURNING id_cliente`, [name, email])
      const id = personal.rows[0].id_cliente
      await db.query("UPDATE commerce.identity SET kind = 'cliente', customer = $2, name = $3, email = $4 WHERE subject = $1",
        [subject, id, name, email])
      return { id }
    })
  }

  requestStaff(subject: string, name: string, email: string, branch: number, role: StaffRole) {
    return this.database.transaction(async db => {
      const profile = await this.lockProfile(db, subject, name, email)
      if (profile.kind === 'cliente' || (await db.query(
        'SELECT 1 FROM commerce.department_supervisor WHERE subject = $1', [subject],
      )).rowCount) throw new ForbiddenException()
      if (!(await db.query(`SELECT 1 FROM public.farmacia f
        JOIN commerce.city_department cd ON cd.city = f.id_ciudad WHERE f.id_farmacia = $1`, [branch])).rowCount) {
        throw new NotFoundException()
      }
      const current = await db.query<{ role: StaffRole }>(
        'SELECT role FROM commerce.branch_staff WHERE subject = $1 AND branch = $2 AND active', [subject, branch],
      )
      if (current.rows[0]?.role === 'jefe' || current.rows[0]?.role === role) throw new ConflictException()
      const existing = await db.query<RequestRow>(`SELECT id, role FROM commerce.staff_request
        WHERE subject = $1 AND branch = $2 AND status = 'pendiente'`, [subject, branch])
      if (existing.rows[0]) {
        if (existing.rows[0].role !== role) throw new ConflictException()
        return { id: existing.rows[0].id, estado: 'pendiente' }
      }
      if (profile.kind === 'solicitante') await db.query(
        'UPDATE commerce.identity SET name = $2, email = $3 WHERE subject = $1', [subject, name, email],
      )
      const response = await db.query<{ id: number }>(
        'INSERT INTO commerce.staff_request (subject, branch, role) VALUES ($1, $2, $3) RETURNING id', [subject, branch, role],
      )
      return { id: response.rows[0].id, estado: 'pendiente' }
    })
  }

  requests(subject: string) {
    return this.database.transaction(async db => {
      const branches = await this.access.branches(db, subject)
      const forSupervisor = branches.filter(branch => branch.rol === 'supervisor').map(branch => branch.id)
      const forManager = branches.filter(branch => branch.rol === 'jefe').map(branch => branch.id)
      const { rows } = await db.query(`SELECT r.id, i.name AS nombre, i.email AS correo, r.branch AS sucursal,
        r.role AS rol, r.status AS estado, r.created_at AS "creadaEn"
        FROM commerce.staff_request r JOIN commerce.identity i ON i.subject = r.subject
        WHERE (r.subject = $1 OR
          (r.status = 'pendiente' AND (
            (r.role = 'jefe' AND r.branch = ANY($2::int[])) OR
            (r.role = 'empleado' AND r.branch = ANY($3::int[]))
          )))
        ORDER BY (r.status = 'pendiente') DESC, r.created_at DESC, r.id DESC LIMIT 100`,
      [subject, forSupervisor, forManager])
      return { solicitudes: rows }
    })
  }

  resolve(subject: string, id: number, status: Exclude<RequestStatus, 'pendiente'>) {
    return this.database.transaction(async db => {
      const initial = (await db.query<RequestRow>(
        'SELECT id, subject, branch, role, status FROM commerce.staff_request WHERE id = $1', [id],
      )).rows[0]
      if (!initial) throw new NotFoundException()
      await this.access.requireBranch(db, subject, initial.branch, [approvingRole(initial.role)])
      if (initial.subject === subject) throw new ForbiddenException()
      const profile = (await db.query<Identity>(
        'SELECT kind, name, customer FROM commerce.identity WHERE subject = $1 FOR UPDATE', [initial.subject],
      )).rows[0]
      const locked = (await db.query<RequestRow>(
        'SELECT id, subject, branch, role, status FROM commerce.staff_request WHERE id = $1 FOR UPDATE', [id],
      )).rows[0]
      if (!locked || locked.status !== 'pendiente' || profile.kind === 'cliente') throw new ConflictException()
      if (status === 'aprobada') await this.assign(db, subject, locked, profile.name)
      await db.query(
        'UPDATE commerce.staff_request SET status = $2, resolved_at = now(), resolved_by = $3 WHERE id = $1',
        [id, status, subject],
      )
      await this.logEvent(db, subject, locked.subject, locked.branch, status)
      return { id, estado: status }
    })
  }

  staffList(subject: string, branch: number) {
    return this.database.transaction(async db => {
      const actor = await this.access.requireBranch(db, subject, branch, ['supervisor', 'jefe'])
      const { rows } = await db.query(`SELECT s.subject AS sub, i.name AS nombre, i.email AS correo,
        s.role AS rol, s.branch AS sucursal, s.active AS activo,
        (s.active AND s.role = $3) AS "sePuedeDesactivar"
        FROM commerce.branch_staff s JOIN commerce.identity i ON i.subject = s.subject
        WHERE s.branch = $1 AND s.role = ANY($2::text[])
        ORDER BY i.name, s.subject LIMIT 150`,
      [branch, actor.rol === 'supervisor' ? ['jefe', 'empleado'] : ['empleado'], actor.rol === 'supervisor' ? 'jefe' : 'empleado'])
      return { personal: rows }
    })
  }

  deactivate(subject: string, branch: number, target: string) {
    return this.database.transaction(async db => {
      const previous = (await db.query<{ role: StaffRole }>(
        'SELECT role FROM commerce.branch_staff WHERE subject = $1 AND branch = $2', [target, branch],
      )).rows[0]
      if (!previous) throw new NotFoundException()
      await this.access.requireBranch(db, subject, branch, [approvingRole(previous.role)])
      if (subject === target) throw new ForbiddenException()
      const result = await db.query(`UPDATE commerce.branch_staff SET active = false, updated_at = now()
        WHERE subject = $1 AND branch = $2 AND role = $3 AND active`, [target, branch, previous.role])
      if (!result.rowCount) throw new ConflictException()
      await this.logEvent(db, subject, target, branch, 'desactivada')
      return { sub: target, sucursal: branch, activo: false }
    })
  }

  private async lockProfile(db: PoolClient, subject: string, name: string, email: string) {
    await db.query(`INSERT INTO commerce.identity (subject, kind, name, email)
      VALUES ($1, 'solicitante', $2, $3) ON CONFLICT (subject) DO NOTHING`, [subject, name, email])
    const result = await db.query<Identity>(
      'SELECT kind, name, customer FROM commerce.identity WHERE subject = $1 FOR UPDATE', [subject],
    )
    return result.rows[0]
  }

  private async assign(db: PoolClient, actor: string, request: RequestRow, name: string) {
    const values = [request.subject, request.branch, request.role, actor]
    const grant = await db.query(`UPDATE commerce.branch_staff SET role = $3, active = true, approved_by = $4, updated_at = now()
      WHERE subject = $1 AND branch = $2 AND (role <> 'jefe' OR $3 = 'jefe')`, values)
    if (!grant.rowCount) {
      const employee = (await db.query<{ id_empleado: number }>(`INSERT INTO public.empleado
        (id_empleado, id_cargo, id_farmacia, nombre_completo, fecha_ingreso)
        VALUES (nextval('practica_api.identificador'), $1, $2, $3, CURRENT_DATE) RETURNING id_empleado`,
      [request.role === 'jefe' ? 2 : 1, request.branch, name])).rows[0].id_empleado
      await db.query(`INSERT INTO commerce.branch_staff (subject, branch, role, approved_by, employee)
        VALUES ($1, $2, $3, $4, $5)`, [...values, employee])
    }
    await db.query("UPDATE commerce.identity SET kind = 'personal' WHERE subject = $1", [request.subject])
  }

  private async logEvent(db: PoolClient, actor: string, target: string, branch: number, action: string) {
    await db.query('INSERT INTO commerce.staff_event (actor, target, branch, action) VALUES ($1, $2, $3, $4)',
      [actor, target, branch, action])
  }
}
