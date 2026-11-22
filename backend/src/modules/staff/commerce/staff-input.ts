import { BadRequestException } from '@nestjs/common'
import type { StaffRole } from './commerce-access.js'

export function bodyObject(input: unknown): Record<string, unknown> {
  if (typeof input !== 'object' || !input || Array.isArray(input)) throw new BadRequestException()
  return input as Record<string, unknown>
}

export function identifier(input: unknown): number {
  const value = typeof input === 'string' && /^\d+$/u.test(input) ? Number(input) : input
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 2_147_483_647) {
    throw new BadRequestException()
  }
  return value
}

export function actorId(input: string) {
  if (!/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/iu.test(input)) throw new BadRequestException()
  return input
}

export function nameField(input: unknown) {
  if (typeof input !== 'string') throw new BadRequestException()
  const value = input.trim().replace(/\s+/gu, ' ')
  if (value.length < 2 || value.length > 100) throw new BadRequestException()
  return value
}

export function emailField(input: string | null) {
  if (!input || input.length > 150 || !/^[^\s@]+@[^\s@]+$/u.test(input)) throw new BadRequestException()
  return input
}

export function staffRole(input: unknown): StaffRole {
  if (input !== 'jefe' && input !== 'empleado') throw new BadRequestException()
  return input
}

export function resolution(input: unknown) {
  if (input !== 'aprobada' && input !== 'rechazada') throw new BadRequestException()
  return input
}
