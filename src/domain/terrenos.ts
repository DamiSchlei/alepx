import type { Terreno } from './types'

export const TERRENOS: readonly Terreno[] = ['literatura', 'arte', 'empresa'] as const

export interface TerrenoInfo {
  id: Terreno
  label: string
  color: string
  bgSoft: string
  border: string
  whatItDoes: string
  ifMissing: string
  filterQuestion: string
}

export const TERRENO_MAP: Record<Terreno, TerrenoInfo> = {
  literatura: {
    id: 'literatura',
    label: 'Literatura',
    color: '#7a3fe0', // violeta
    bgSoft: '#f5f0ff',
    border: '#d8b4fe',
    whatItDoes: 'Nombra y decide: palabra, reglas, tiempos, lugares',
    ifMissing: 'Arte se vuelve confesión; Empresa, movimiento ciego',
    filterQuestion: '¿Queda escrito o decidido?',
  },
  arte: {
    id: 'arte',
    label: 'Arte',
    color: '#4f46e5', // índigo
    bgSoft: '#eef2ff',
    border: '#c7d2fe',
    whatItDoes: 'Atraviesa: miedo, postura, límite, quién estás siendo al hacer',
    ifMissing: 'Literatura es burocracia; Empresa, inercia',
    filterQuestion: '¿Hay roce interno (miedo / postura / límite)?',
  },
  empresa: {
    id: 'empresa',
    label: 'Empresa',
    color: '#0f9f6e', // verde
    bgSoft: '#f0fdf4',
    border: '#bbf7d0',
    whatItDoes: 'Imprime: plata, gente, cosas, procesos, producto',
    ifMissing: 'El resto no toca el mundo',
    filterQuestion: '¿Se mueve algo tangible?',
  },
}

export const SUELTO_COLOR = '#c47a00' // ámbar

export function terrenoColor(terreno?: Terreno): string {
  if (!terreno) return SUELTO_COLOR
  return TERRENO_MAP[terreno]?.color ?? SUELTO_COLOR
}

export function terrenoLabel(terreno?: Terreno): string {
  if (!terreno) return 'Suelto'
  return TERRENO_MAP[terreno]?.label ?? 'Suelto'
}
