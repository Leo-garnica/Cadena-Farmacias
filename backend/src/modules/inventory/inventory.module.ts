import { Module } from '@nestjs/common'
import { InventoryQueries } from './application/inventory.queries.js'
import { DemoInventoryRepository } from './infrastructure/demo/demo-inventory.repository.js'
import { InventoryController } from './presentation/inventory.controller.js'

@Module({
  controllers: [InventoryController],
  providers: [{ provide: InventoryQueries, useFactory: () => new InventoryQueries(new DemoInventoryRepository()) }],
  exports: [InventoryQueries],
})
export class InventoryModule {}
