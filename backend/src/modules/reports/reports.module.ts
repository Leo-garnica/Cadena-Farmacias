import { Controller, Get, Inject, Module, Query } from '@nestjs/common'
import { CurrentAccess, type AccessGrant } from '../access/public.js'
import { InventoryModule, InventoryQueries, parseInventoryQuery } from '../inventory/public.js'

@Controller('reports')
class ReportsController {
  constructor(@Inject(InventoryQueries) private readonly inventory: InventoryQueries) {}

  @Get('inventory')
  async inventoryReport(@CurrentAccess() access: AccessGrant, @Query() raw: Record<string, unknown>) {
    const query = await parseInventoryQuery(raw, access.sucursales, this.inventory)
    return this.inventory.report(access.sucursales, query)
  }
}

@Module({ imports: [InventoryModule], controllers: [ReportsController] })
export class ReportsModule {}
