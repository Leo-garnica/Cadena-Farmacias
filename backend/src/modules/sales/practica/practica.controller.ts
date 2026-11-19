import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Put, Query } from '@nestjs/common'
import { CurrentAccess, type AccessGrant } from '../../access/public.js'
import { ConexionPractica } from './conexion.js'
import { recursos } from './recursos.js'
import { eliminar, listar, opciones, registrar } from './registros.js'
import { detalle, vender, ventas } from './ventas.js'
import { entero } from './validacion.js'

@Controller('practica')
export class PracticaController {
  constructor(@Inject(ConexionPractica) private readonly conexion: ConexionPractica) {}
  @Get('recursos')
  recursos(@CurrentAccess() access: AccessGrant) {
    return this.conexion.usar(access,async () => ({recursos: recursos.map(({clave,titulo,id,campos,columnas})=>({clave,titulo,id,campos,columnas}))}))
  }
  @Get('opciones/:referencia')
  opciones(@CurrentAccess() access: AccessGrant,@Param('referencia') ref: string,@Query('q') q?: string,@Query('offset') offset?: string,@Query('farmacia') farmacia?: string) {
    return this.conexion.usar(access,db=>opciones(db,access,ref,q,offset,farmacia))
  }
  @Get('registros/:clave')
  listar(@CurrentAccess() access: AccessGrant,@Param('clave') clave: string,@Query('q') q?: string,@Query('offset') offset?: string) {
    return this.conexion.usar(access,db=>listar(db,access,clave,q,offset))
  }
  @Post('registros/:clave')
  alta(@CurrentAccess() access: AccessGrant,@Param('clave') clave: string,@Body() body: unknown) {
    return this.conexion.usar(access,db=>registrar(db,access,clave,body))
  }
  @Put('registros/:clave/:id')
  editar(@CurrentAccess() access: AccessGrant,@Param('clave') clave: string,@Param('id') id: string,@Body() body: unknown) {
    return this.conexion.usar(access,db=>registrar(db,access,clave,body,entero(id)))
  }
  @Delete('registros/:clave/:id')
  @HttpCode(204)
  borrar(@CurrentAccess() access: AccessGrant,@Param('clave') clave: string,@Param('id') id: string) {
    return this.conexion.usar(access,db=>eliminar(db,access,clave,entero(id)))
  }
  @Get('ventas')
  ventas(@CurrentAccess() access: AccessGrant,@Query('offset') offset?: string) {
    return this.conexion.usar(access,db=>ventas(db,access,offset))
  }
  @Get('ventas/:id')
  detalle(@CurrentAccess() access: AccessGrant,@Param('id') id: string) {
    return this.conexion.usar(access,db=>detalle(db,access,entero(id)))
  }
  @Post('ventas')
  vender(@CurrentAccess() access: AccessGrant,@Body() body: unknown) {
    return this.conexion.usar(access,db=>vender(db,access,body))
  }
}
