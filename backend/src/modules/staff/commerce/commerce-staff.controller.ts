import { BadRequestException, Body, Controller, Get, Inject, Param, Patch, Post, Query } from '@nestjs/common'
import { CurrentIdentity, CurrentIdentityEmail, VerifiedIdentity } from '../../access/public.js'
import { CommerceStaff } from './commerce-staff.service.js'
import { actorId, bodyObject, emailField, identifier, nameField, resolution, staffRole } from './staff-input.js'

@Controller('comercio')
@VerifiedIdentity()
export class CommerceStaffController {
  constructor(@Inject(CommerceStaff) private readonly staff: CommerceStaff) {}

  @Get('identidad')
  identity(@CurrentIdentity() subject: string) {
    return this.staff.identity(subject)
  }

  @Post('clientes')
  customer(@CurrentIdentity() subject: string, @CurrentIdentityEmail() email: string | null, @Body() input: unknown) {
    const body = bodyObject(input)
    return this.staff.registerCustomer(subject, nameField(body.nombre), emailField(email))
  }

  @Post('accesos/solicitudes')
  request(@CurrentIdentity() subject: string, @CurrentIdentityEmail() email: string | null, @Body() input: unknown) {
    const body = bodyObject(input)
    return this.staff.requestStaff(subject, nameField(body.nombre), emailField(email), identifier(body.sucursal), staffRole(body.rol))
  }

  @Get('accesos/solicitudes')
  requests(@CurrentIdentity() subject: string) {
    return this.staff.requests(subject)
  }

  @Patch('accesos/solicitudes/:id')
  resolve(@CurrentIdentity() subject: string, @Param('id') id: string, @Body() input: unknown) {
    return this.staff.resolve(subject, identifier(id), resolution(bodyObject(input).estado))
  }

  @Get('accesos/personal')
  listStaff(@CurrentIdentity() subject: string, @Query('sucursal') branch: unknown) {
    return this.staff.staffList(subject, identifier(branch))
  }

  @Patch('accesos/personal/:sub')
  deactivate(@CurrentIdentity() subject: string, @Param('sub') target: string, @Body() input: unknown) {
    const body = bodyObject(input)
    if (body.activo !== false) throw new BadRequestException()
    return this.staff.deactivate(subject, identifier(body.sucursal), actorId(target))
  }
}
