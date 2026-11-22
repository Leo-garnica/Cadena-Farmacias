import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common'
import { CommerceAccess, CommerceDatabase } from '../../staff/public.js'
import { branchQueue, changeOrder, ownOrders, payOrder, type Action } from './orders.js'
import { addCounterCustomer, addProduct, branchCustomers, categories } from './records.js'
import { counterSale, history } from './sales.js'
import { adjustStock, branches, catalog, deliveryZones, stockMovements } from './stock.js'
import { civilDate, expectedAmount, fingerprint, id, items, operationId, optionalText, request, signedQuantity, text } from './validation.js'

const operators = ['jefe', 'empleado'] as const
const managers = ['jefe', 'supervisor'] as const
const actions = ['tomar', 'liberar', 'preparar', 'despachar', 'entregar', 'cancelar', 'reasignar', 'devolver'] as const

@Injectable()
export class CommerceService {
  constructor(
    @Inject(CommerceDatabase) private readonly database: CommerceDatabase,
    @Inject(CommerceAccess) private readonly access: CommerceAccess,
  ) {}

  branches() {
    return this.database.transaction(branches)
  }

  catalog(branch: string, query?: string, offset?: string) {
    return this.database.transaction(db => catalog(db, id(branch), optionalText(query, 100) ?? '', offset))
  }

  zones(branch: string) {
    return this.database.transaction(db => deliveryZones(db, id(branch)))
  }

  categories() {
    return this.database.transaction(categories)
  }

  placeOrder(sub: string, input: unknown) {
    const body = request(input)
    const modalidad = body.modalidad
    if (modalidad !== 'retiro' && modalidad !== 'envio') throw new BadRequestException()
    const data = {
      modalidad,
      farmacia: id(body.farmacia),
      zona: modalidad === 'envio' ? id(body.zona) : null,
      direccion: modalidad === 'envio' ? text(body.direccion, 200) : null,
      items: items(body.items),
      expected: expectedAmount(body.totalEsperadoCentavos),
    } as const
    return this.database.transaction(async db => {
      const client = await this.access.requireClient(db, sub)
      return payOrder(db, sub, client, { ...data, operacion: operationId(body.operacionId), solicitud: fingerprint(data) })
    })
  }

  myOrders(sub: string, offset?: string) {
    return this.database.transaction(async db => {
      await this.access.requireClient(db, sub)
      return ownOrders(db, sub, offset)
    })
  }

  queue(sub: string, branch: string, finalizados?: string, offset?: string) {
    const branchId = id(branch)
    return this.database.transaction(async db => {
      const terminal = finalizados === '1'
      await this.access.requireBranch(db, sub, branchId, terminal ? managers : [...operators, 'supervisor'])
      return branchQueue(db, sub, branchId, terminal, offset)
    })
  }

  changeOrder(sub: string, order: string, input: unknown) {
    const body = request(input)
    if (typeof body.accion !== 'string' || !actions.includes(body.accion as Action)) throw new BadRequestException()
    const accion = body.accion as Action
    const codigoRetiro = optionalText(body.codigoRetiro, 6)
    if (codigoRetiro !== null && !/^\d{6}$/u.test(codigoRetiro)) throw new BadRequestException()
    const motivo = optionalText(body.motivo, 200)
    const empleadoSub = accion === 'reasignar' ? operationId(body.empleadoSub) : null
    return this.database.transaction(db => changeOrder(db, this.access, sub, id(order), { accion, codigoRetiro, motivo, empleadoSub }))
  }

  sell(sub: string, input: unknown) {
    const body = request(input)
    const data = { farmacia: id(body.farmacia), cliente: body.cliente == null ? null : id(body.cliente),
      items: items(body.items), expected: expectedAmount(body.totalEsperadoCentavos) }
    return this.database.transaction(async db => {
      const member = await this.access.requireBranch(db, sub, data.farmacia, operators)
      if (!member.empleadoId) throw new ForbiddenException()
      return counterSale(db, { ...data, sub, empleado: member.empleadoId,
        operacion: operationId(body.operacionId), solicitud: fingerprint(data) })
    })
  }

  customers(sub: string, branch: string, query?: string, offset?: string) {
    const branchId = id(branch)
    return this.database.transaction(async db => {
      await this.access.requireBranch(db, sub, branchId, operators)
      return branchCustomers(db, branchId, optionalText(query, 100) ?? '', offset)
    })
  }

  addCustomer(sub: string, input: unknown) {
    const body = request(input)
    const branch = id(body.farmacia)
    return this.database.transaction(async db => {
      await this.access.requireBranch(db, sub, branch, operators)
      return addCounterCustomer(db, branch, text(body.nombres, 100), text(body.apellidos, 100))
    })
  }

  addProduct(sub: string, input: unknown) {
    const body = request(input)
    const price = expectedAmount(body.precioCentavos)
    if (!price) throw new BadRequestException()
    const data = {
      farmacia: id(body.farmacia), categoria: id(body.categoria), nombre: text(body.nombre, 100),
      presentacion: text(body.presentacion, 100), precioCentavos: price,
    }
    return this.database.transaction(async db => {
      await this.access.requireBranch(db, sub, data.farmacia, ['supervisor'])
      return addProduct(db, sub, { ...data, operacion: operationId(body.operacionId), solicitud: fingerprint(data) })
    })
  }

  history(sub: string, branch?: string, fromDate?: string, toDate?: string, channelName?: string, statusName?: string, first?: string) {
    const from = civilDate(fromDate)
    const to = civilDate(toDate)
    if (from && to && from > to) throw new BadRequestException()
    const channel = channelName || null
    if (channel !== null && channel !== 'online' && channel !== 'presencial') throw new BadRequestException()
    const status = statusName || null
    if (status !== null && status !== 'vigente' && status !== 'revertida') throw new BadRequestException()
    return this.database.transaction(async db => {
      const available = (await this.access.branches(db, sub)).filter(member => member.rol === 'supervisor').map(member => member.id)
      const requested = branch ? id(branch) : null
      if (!available.length || (requested !== null && !available.includes(requested))) throw new ForbiddenException()
      const branches = requested === null ? available : [requested]
      return history(db, { branches, from, to, channel, status, first })
    })
  }

  movements(sub: string, branch: string, offset?: string) {
    const branchId = id(branch)
    return this.database.transaction(async db => {
      await this.access.requireBranch(db, sub, branchId, managers)
      return stockMovements(db, branchId, offset)
    })
  }

  adjustStock(sub: string, input: unknown) {
    const body = request(input)
    const data = { farmacia: id(body.farmacia), codigo: id(body.codigo),
      cantidad: signedQuantity(body.cantidad), motivo: text(body.motivo, 200) }
    return this.database.transaction(async db => {
      await this.access.requireBranch(db, sub, data.farmacia, managers)
      return adjustStock(db, sub, { ...data, operacion: operationId(body.operacionId), solicitud: fingerprint(data) })
    })
  }
}
