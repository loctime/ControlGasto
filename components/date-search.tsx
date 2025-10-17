"use client"

import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "./ui/input"

interface DateSearchProps {
  onDateChange: (date: Date | null) => void
  onSearchTermChange?: (searchTerm: string) => void
  placeholder?: string
}

export function DateSearch({ onDateChange, onSearchTermChange, placeholder = "DD/MM/YYYY" }: DateSearchProps) {
  const [dateString, setDateString] = useState("")
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (!dateString.trim()) {
      onDateChange(null)
      onSearchTermChange?.("")
      setIsValid(true)
      return
    }

    // Validar formato DD/MM/YYYY
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    const match = dateString.match(dateRegex)
    
    if (match) {
      const day = parseInt(match[1])
      const month = parseInt(match[2])
      const year = parseInt(match[3])
      
      // Validar rango de fechas más estricto
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const date = new Date(year, month - 1, day)
        
        // Verificar que la fecha sea válida (no 31 de febrero, etc.)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          onDateChange(date)
          onSearchTermChange?.(dateString) // Actualizar searchTerm con la fecha
          setIsValid(true)
        } else {
          setIsValid(false)
        }
      } else {
        setIsValid(false)
      }
    } else {
      // Validar formato parcial mientras se escribe
      if (dateString.length > 0) {
        const parts = dateString.split('/')
        
        // Validar día (1-31) - ajustar automáticamente si se pasa
        if (parts[0]) {
          const day = parseInt(parts[0])
          if (day < 1) {
            setIsValid(false)
            return
          } else if (day > 31) {
            // Ajustar automáticamente a 31
            const newValue = '31/' + (parts[1] || '') + '/' + (parts[2] || '')
            setDateString(newValue)
            return
          }
        }
        
        // Validar mes (1-12) - ajustar automáticamente si se pasa
        if (parts[1]) {
          const month = parseInt(parts[1])
          if (month < 1) {
            setIsValid(false)
            return
          } else if (month > 12) {
            // Ajustar automáticamente a 12
            const newValue = parts[0] + '/12/' + (parts[2] || '')
            setDateString(newValue)
            return
          }
        }
        
        // Validar año (2000-2100)
        if (parts[2] && (parseInt(parts[2]) < 2000 || parseInt(parts[2]) > 2100)) {
          setIsValid(false)
          return
        }
        
        setIsValid(true)
      } else {
        setIsValid(true)
      }
    }
  }, [dateString, onDateChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Solo permitir números y barras
    value = value.replace(/[^\d\/]/g, '')
    
    // Limitar longitud máxima
    if (value.length > 10) {
      value = value.slice(0, 10)
    }
    
    // Auto-formatear con barras automáticas
    let formatted = ''
    let numbers = value.replace(/\//g, '') // Solo números
    
    if (numbers.length >= 1) {
      formatted += numbers.slice(0, 2) // Día
    }
    
    if (numbers.length >= 3) {
      formatted += '/' + numbers.slice(2, 4) // Mes
    }
    
    if (numbers.length >= 5) {
      formatted += '/' + numbers.slice(4, 8) // Año
    }
    
    setDateString(formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir solo números, barras, backspace, delete, arrow keys
    if (!/[0-9\/\b\s\-\t]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault()
    }
    
    // Prevenir múltiples barras consecutivas
    if (e.key === '/' && dateString.includes('/')) {
      e.preventDefault()
    }
  }

  return (
    <div className="relative">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      <Input
        type="text"
        placeholder={placeholder}
        value={dateString}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={`pl-10 h-10 border-2 transition-all duration-300 rounded-xl ${
          isValid 
            ? 'border-primary/20 focus:border-primary focus:ring-primary' 
            : 'border-red-300 focus:border-red-500 focus:ring-red-500'
        }`}
        maxLength={10}
      />
      {!isValid && dateString && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-500">
          Formato: DD/MM/YYYY
        </div>
      )}
    </div>
  )
}
