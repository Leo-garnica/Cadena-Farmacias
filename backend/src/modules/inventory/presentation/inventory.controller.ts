import { Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common'
import { CurrentAccess, type AccessGrant } from '../../access/public.js'
import { InventoryQueries } from '../application/inventory.queries.js'
import { parseInventoryQuery, parsePositiveId } from './inventory-query.parser.js'

@Controller('inventory')
export class InventoryController {
  constructor(@Inject(InventoryQueries) private readonly inventory: InventoryQueries) {}

  @Get('metadata')
  metadata(@CurrentAccess() access: AccessGrant) { return this.inventory.metadata(access.sucursales) }

  @Get()
  async list(@CurrentAccess() access: AccessGrant, @Query() raw: Record<string, unknown>) {
    const query = await parseInventoryQuery(raw, access.sucursales, this.inventory)
    return this.inventory.list(access.sucursales, query)
  }

  @Get(':idFarmacia/:codigoProducto')
  async detail(@CurrentAccess() access: AccessGrant, @Param('idFarmacia') branch: string, @Param('codigoProducto') product: string) {
    const row = await this.inventory.detail(access.sucursales, parsePositiveId(branch), parsePositiveId(product))
    if (row === null) throw new NotFoundException()
    return row
  }
}
