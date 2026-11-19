import { Module } from '@nestjs/common'
import { ConexionPractica } from './practica/conexion.js'
import { PracticaController } from './practica/practica.controller.js'

@Module({ controllers: [PracticaController], providers: [ConexionPractica] })
export class SalesModule {}
