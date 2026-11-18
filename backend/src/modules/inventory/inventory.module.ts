import { Module } from '@nestjs/common'
import { ReadDatabase, ReadDatabaseModule } from '../../platform/database/read-database.js'
import { InventoryQueries } from './application/inventory.queries.js'
import { PostgresInventoryRepository } from './infrastructure/postgres/postgres-inventory.repository.js'
import { InventoryController } from './presentation/inventory.controller.js'

@Module({
  imports: [ReadDatabaseModule],
  controllers: [InventoryController],
  providers: [{ provide: InventoryQueries, inject: [ReadDatabase], useFactory: (db: ReadDatabase) => new InventoryQueries(new PostgresInventoryRepository(db)) }],
  exports: [InventoryQueries],
})
export class InventoryModule {}
