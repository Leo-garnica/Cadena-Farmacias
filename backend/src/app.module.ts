import { Module } from '@nestjs/common'
import { HealthController } from './platform/http/health.controller.js'
import { InventoryModule } from './modules/inventory/public.js'
import { BranchesModule } from './modules/branches/public.js'
import { CatalogModule } from './modules/catalog/public.js'
import { SuppliersModule } from './modules/suppliers/public.js'
import { SalesModule } from './modules/sales/public.js'
import { StaffModule } from './modules/staff/public.js'
import { AccessModule } from './modules/access/public.js'
import { AuditModule } from './modules/audit/public.js'
import { ReportsModule } from './modules/reports/public.js'

@Module({
  imports: [InventoryModule, BranchesModule, CatalogModule, SuppliersModule, SalesModule, StaffModule, AccessModule, AuditModule, ReportsModule],
  controllers: [HealthController],
})
export class AppModule {}
