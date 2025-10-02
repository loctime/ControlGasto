import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un número como moneda con punto de miles y sin centavos
 * @param amount - El monto a formatear
 * @returns String formateado (ej: "$1.500")
 */
export function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString('es-ES')}`
}
