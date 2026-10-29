import { Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common'
import { InventoryQueries } from '../application/inventory.queries.js'
import { parseInventoryQuery, parsePositiveId } from './inventory-query.parser.js'

@Controller('inventory')
export class InventoryController {
  constructor(@Inject(InventoryQueries) private readonly inventory: InventoryQueries) {}

  @Get('metadata')
  metadata() { return this.inventory.metadata() }

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.inventory.list(parseInventoryQuery(query, this.inventory.metadata()))
  }

  @Get(':idFarmacia/:codigoProducto')
  async detail(@Param('idFarmacia') branch: string, @Param('codigoProducto') product: string) {
    const row = await this.inventory.detail(parsePositiveId(branch), parsePositiveId(product))
    if (row === null) throw new NotFoundException()
    return row
  }
}
