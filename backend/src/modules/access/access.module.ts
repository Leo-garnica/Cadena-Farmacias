import { Controller, Get, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AccessGuard, CurrentAccess, type AccessGrant } from './access.guard.js'

@Controller('me')
class AccessController {
  @Get()
  get(@CurrentAccess() access: AccessGrant) { return access }
}

@Module({ controllers: [AccessController], providers: [{ provide: APP_GUARD, useClass: AccessGuard }] })
export class AccessModule {}
