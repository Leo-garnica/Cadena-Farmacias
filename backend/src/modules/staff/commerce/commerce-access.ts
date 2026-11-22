import { ForbiddenException, Injectable } from '@nestjs/common'
import type { PoolClient } from 'pg'

export type StaffRole = 'jefe' | 'empleado'
export type CommerceRole = StaffRole | 'supervisor'

interface BranchAccess {
  id: number
  nombre: string
  departamento: string
  rol: CommerceRole
  empleadoId: number | null
}

const supervisorBranches = `
  SELECT f.id_farmacia AS id, f.nombre, d.name AS departamento,
    'supervisor' AS rol, NULL::int AS "empleadoId"
  FROM commerce.department_supervisor sp
  JOIN commerce.department d ON d.id = sp.department
  JOIN commerce.city_department cd ON cd.department = d.id
  JOIN public.farmacia f ON f.id_ciudad = cd.city
  WHERE sp.subject = $1`
const employeeBranches = `
  SELECT f.id_farmacia AS id, f.nombre, d.name AS departamento,
    s.role AS rol, s.employee AS "empleadoId"
  FROM commerce.branch_staff s
  JOIN public.farmacia f ON f.id_farmacia = s.branch
  JOIN public.empleado e ON e.id_empleado = s.employee AND e.id_farmacia = s.branch
  JOIN commerce.city_department cd ON cd.city = f.id_ciudad
  JOIN commerce.department d ON d.id = cd.department
  WHERE s.subject = $1 AND s.active`

@Injectable()
export class CommerceAccess {
  async branches(db: PoolClient, subject: string) {
    return (await db.query<BranchAccess>(
      supervisorBranches + ' UNION ALL ' + employeeBranches + ' ORDER BY id, rol', [subject],
    )).rows
  }

  async requireBranch(db: PoolClient, subject: string, branch: number, roles: readonly CommerceRole[]) {
    if (roles.includes('supervisor')) {
      const result = await db.query<BranchAccess>(
        supervisorBranches + ' AND f.id_farmacia = $2 FOR SHARE OF f', [subject, branch],
      )
      if (result.rows[0]) return result.rows[0]
    }
    const result = await db.query<BranchAccess>(
      employeeBranches + ' AND f.id_farmacia = $2 AND s.role = ANY($3::text[]) FOR SHARE OF s, e, f', [subject, branch, roles],
    )
    if (!result.rows[0]) throw new ForbiddenException()
    return result.rows[0]
  }

  async requireClient(db: PoolClient, subject: string) {
    const result = await db.query<{ customer: number }>(
      "SELECT customer FROM commerce.identity WHERE subject = $1 AND kind = 'cliente' FOR SHARE", [subject],
    )
    if (!result.rows[0]) throw new ForbiddenException()
    return result.rows[0].customer
  }
}
