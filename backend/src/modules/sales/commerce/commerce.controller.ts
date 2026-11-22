import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common'
import { CurrentIdentity, PublicEndpoint, VerifiedIdentity } from '../../access/public.js'
import { CommerceService } from './commerce.service.js'

@VerifiedIdentity()
@Controller('comercio')
export class CommerceController {
  constructor(@Inject(CommerceService) private readonly commerce: CommerceService) {}

  @Get('sucursales')
  @PublicEndpoint()
  branches() {
    return this.commerce.branches()
  }

  @Get('catalogo')
  @PublicEndpoint()
  catalog(@Query('farmacia') branch: string, @Query('q') query?: string, @Query('offset') first?: string) {
    return this.commerce.catalog(branch, query, first)
  }

  @Get('zonas')
  @PublicEndpoint()
  zones(@Query('farmacia') branch: string) {
    return this.commerce.zones(branch)
  }

  @Get('categorias')
  @PublicEndpoint()
  categories() {
    return this.commerce.categories()
  }

  @Post('pedidos')
  placeOrder(@CurrentIdentity() sub: string, @Body() body: unknown) {
    return this.commerce.placeOrder(sub, body)
  }

  @Get('pedidos')
  myOrders(@CurrentIdentity() sub: string, @Query('offset') first?: string) {
    return this.commerce.myOrders(sub, first)
  }

  @Get('cola')
  queue(@CurrentIdentity() sub: string, @Query('farmacia') branch: string,
    @Query('finalizados') finalizados?: string, @Query('offset') first?: string) {
    return this.commerce.queue(sub, branch, finalizados, first)
  }

  @Post('pedidos/:id/accion')
  changeOrder(@CurrentIdentity() sub: string, @Param('id') order: string, @Body() body: unknown) {
    return this.commerce.changeOrder(sub, order, body)
  }

  @Post('caja')
  sell(@CurrentIdentity() sub: string, @Body() body: unknown) {
    return this.commerce.sell(sub, body)
  }

  @Get('caja/clientes')
  customers(@CurrentIdentity() sub: string, @Query('farmacia') branch: string, @Query('q') query?: string,
    @Query('offset') first?: string) {
    return this.commerce.customers(sub, branch, query, first)
  }

  @Post('caja/clientes')
  addCustomer(@CurrentIdentity() sub: string, @Body() body: unknown) {
    return this.commerce.addCustomer(sub, body)
  }

  @Post('productos')
  addProduct(@CurrentIdentity() sub: string, @Body() body: unknown) {
    return this.commerce.addProduct(sub, body)
  }

  @Get('historial')
  history(@CurrentIdentity() sub: string, @Query('farmacia') branch?: string, @Query('desde') from?: string,
    @Query('hasta') to?: string, @Query('canal') channel?: string, @Query('estado') status?: string, @Query('offset') first?: string) {
    return this.commerce.history(sub, branch, from, to, channel, status, first)
  }

  @Get('movimientos')
  movements(@CurrentIdentity() sub: string, @Query('farmacia') branch: string, @Query('offset') first?: string) {
    return this.commerce.movements(sub, branch, first)
  }

  @Post('stock')
  adjustStock(@CurrentIdentity() sub: string, @Body() body: unknown) {
    return this.commerce.adjustStock(sub, body)
  }
}
