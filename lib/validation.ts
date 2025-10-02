import { z } from 'zod'
import { useState, useCallback } from 'react'

// ✅ VALIDACIÓN: Esquemas de validación para gastos
export const expenseSchema = z.object({
  name: z.string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),
  amount: z.number()
    .positive("El monto debe ser positivo")
    .max(999999, "El monto no puede exceder $999,999")
    .multipleOf(0.01, "El monto debe tener máximo 2 decimales"),
  category: z.enum([
    'hogar', 
    'transporte', 
    'alimentacion', 
    'servicios', 
    'entretenimiento', 
    'salud', 
    'otros'
  ], {
    errorMap: () => ({ message: "Categoría inválida" })
  }),
  paid: z.boolean().default(false)
})

// ✅ VALIDACIÓN: Esquema para filtros
export const filterSchema = z.object({
  view: z.enum(['week', 'month']).default('month'),
  category: z.string().optional(),
  status: z.enum(['all', 'paid', 'pending']).default('all'),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional()
  }).optional()
})

// ✅ VALIDACIÓN: Esquema para usuario
export const userSchema = z.object({
  email: z.string().email("Email inválido"),
  displayName: z.string().min(1, "Nombre requerido").max(50, "Nombre muy largo"),
  photoURL: z.string().url().optional()
})

// ✅ VALIDACIÓN: Esquema para configuración
export const configSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  currency: z.string().default('USD'),
  language: z.string().default('es'),
  notifications: z.boolean().default(true)
})

// ✅ VALIDACIÓN: Funciones de validación
export const validateExpense = (data: unknown) => {
  try {
    return expenseSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '))
    }
    throw error
  }
}

export const validateFilter = (data: unknown) => {
  try {
    return filterSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(error.errors.map(e => e.message).join(', '))
    }
    throw error
  }
}

// ✅ VALIDACIÓN: Hook para validación en tiempo real
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValid, setIsValid] = useState(false)

  const validate = useCallback((data: unknown) => {
    try {
      schema.parse(data)
      setErrors({})
      setIsValid(true)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
        setErrors(fieldErrors)
        setIsValid(false)
        return false
      }
      return false
    }
  }, [schema])

  const clearErrors = useCallback(() => {
    setErrors({})
    setIsValid(false)
  }, [])

  return { errors, isValid, validate, clearErrors }
}

// ✅ VALIDACIÓN: Tipos inferidos
export type ExpenseInput = z.infer<typeof expenseSchema>
export type FilterInput = z.infer<typeof filterSchema>
export type UserInput = z.infer<typeof userSchema>
export type ConfigInput = z.infer<typeof configSchema>
