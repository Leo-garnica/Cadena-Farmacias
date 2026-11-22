import { Module } from '@nestjs/common'
import { ConexionPractica } from './practica/conexion.js'
import { PracticaController } from './practica/practica.controller.js'
import { CommerceStaffModule } from '../staff/public.js'
import { CommerceController } from './commerce/commerce.controller.js'
import { CommerceService } from './commerce/commerce.service.js'

@Module({
  imports: [CommerceStaffModule],
  controllers: [PracticaController, CommerceController],
  providers: [ConexionPractica, CommerceService],
})
export class SalesModule {}
