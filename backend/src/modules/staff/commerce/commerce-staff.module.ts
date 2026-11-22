import { Module } from '@nestjs/common'
import { CommerceAccess } from './commerce-access.js'
import { CommerceDatabase } from './commerce-database.js'
import { CommerceStaffController } from './commerce-staff.controller.js'
import { CommerceStaff } from './commerce-staff.service.js'

@Module({
  controllers: [CommerceStaffController],
  providers: [CommerceAccess, CommerceDatabase, CommerceStaff],
  exports: [CommerceAccess, CommerceDatabase],
})
export class CommerceStaffModule {}
