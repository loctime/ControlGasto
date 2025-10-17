"use client"

import { Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "./ui/input"

interface DateSearchProps {
  onDateChange: (date: Date | null) => void
  placeholder?: string
}

export function DateSearch({ onDateChange, placeholder = "DD/MM/YYYY" }: DateSearchProps) {
  const [dateString, setDateString] = useState("")
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    if (!dateString.trim()) {
      onDateChange(null)
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
      
      // Validar rango de fechas
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        const date = new Date(year, month - 1, day)
        
        // Verificar que la fecha sea válida (no 31 de febrero, etc.)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          onDateChange(date)
          setIsValid(true)
        } else {
          setIsValid(false)
        }
      } else {
        setIsValid(false)
      }
    } else {
      setIsValid(false)
    }
  }, [dateString, onDateChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Solo permitir números y barras
    value = value.replace(/[^\d\/]/g, '')
    
    // Auto-formatear mientras se escribe
    if (value.length <= 2) {
      // Solo día
      setDateString(value)
    } else if (value.length <= 5) {
      // Día/Mes
      if (value.length === 3 && !value.includes('/')) {
        value = value.slice(0, 2) + '/' + value.slice(2)
      }
      setDateString(value)
    } else if (value.length <= 10) {
      // Día/Mes/Año
      if (value.length === 6 && value.split('/').length === 2) {
        value = value + '/'
      }
      setDateString(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir solo números, barras, backspace, delete, arrow keys
    if (!/[0-9\/\b\s\-\t]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
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
