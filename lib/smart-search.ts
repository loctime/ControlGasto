import { Payment } from "./types"

export interface SmartSearchResult {
  payments: Payment[]
  searchType: 'name' | 'date' | 'month' | 'year' | 'combined'
  searchTerm: string
  matchedPeriod?: {
    type: 'month' | 'year' | 'date'
    value: string
  }
}

export function smartSearch(payments: Payment[], searchTerm: string): SmartSearchResult {
  if (!searchTerm.trim()) {
    return {
      payments,
      searchType: 'name',
      searchTerm: ''
    }
  }

  const term = searchTerm.toLowerCase().trim()
  
  // Detectar patrones de fecha (más flexibles)
  const datePatterns = {
    // Año completo: "2024", "2025"
    year: /^(20\d{2})$/,
    // Mes y año: "octubre 2025", "enero 2024", "oct 2025"
    monthYear: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\s+(20\d{2})$/,
    // Solo mes: "octubre", "enero", "oct"
    month: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/,
    // Fecha específica: "15 octubre 2025", "15 oct 2025"
    specificDate: /^(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)(\s+(20\d{2}))?$/,
    // Fecha en formato DD/MM/YYYY: "14/10/2025", "1/1/2024"
    dateFormat: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // Día del mes: "14", "1", "31"
    dayOfMonth: /^(\d{1,2})$/
  }

  // Patrones flexibles para búsqueda mientras se escribe
  const flexiblePatterns = {
    // Mes parcial: "oct", "ener", "feb"
    monthPartial: /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)$/,
    // Año parcial: "202", "2024"
    yearPartial: /^(20\d{0,2})$/
  }

  // Mapeo de nombres de meses
  const monthMap: Record<string, number> = {
    'enero': 0, 'ene': 0,
    'febrero': 1, 'feb': 1,
    'marzo': 2, 'mar': 2,
    'abril': 3, 'abr': 3,
    'mayo': 4, 'may': 4,
    'junio': 5, 'jun': 5,
    'julio': 6, 'jul': 6,
    'agosto': 7, 'ago': 7,
    'septiembre': 8, 'sep': 8,
    'octubre': 9, 'oct': 9,
    'noviembre': 10, 'nov': 10,
    'diciembre': 11, 'dic': 11
  }

  let filteredPayments = payments
  let searchType: SmartSearchResult['searchType'] = 'name'
  let matchedPeriod: SmartSearchResult['matchedPeriod']

  // Función para detectar coincidencias parciales de meses
  const getPartialMonthMatch = (term: string) => {
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
                       'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    
    // Buscar coincidencias exactas primero
    const exactMatch = monthNames.find(month => month === term)
    if (exactMatch) return exactMatch
    
    // Buscar coincidencias parciales (el término está contenido en el mes)
    const partialMatch = monthNames.find(month => month.startsWith(term))
    if (partialMatch) return partialMatch
    
    // Buscar coincidencias donde el mes contiene el término
    const containsMatch = monthNames.find(month => month.includes(term))
    if (containsMatch) return containsMatch
    
    return null
  }

  // Detectar tipo de búsqueda
  if (datePatterns.dateFormat.test(term)) {
    // Búsqueda por fecha específica en formato DD/MM/YYYY
    const match = term.match(datePatterns.dateFormat)
    if (match) {
      const day = parseInt(match[1])
      const month = parseInt(match[2]) - 1 // Los meses en JS van de 0-11
      const year = parseInt(match[3])
      
      searchType = 'date'
      matchedPeriod = { type: 'date', value: `${day}/${month + 1}/${year}` }
      
      filteredPayments = payments.filter(payment => {
        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
        return paymentDate.getFullYear() === year && 
               paymentDate.getMonth() === month && 
               paymentDate.getDate() === day
      })
    }
  } else if (datePatterns.year.test(term)) {
    // Búsqueda por año
    const year = parseInt(term)
    searchType = 'year'
    matchedPeriod = { type: 'year', value: year.toString() }
    
    filteredPayments = payments.filter(payment => {
      const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
      return paymentDate.getFullYear() === year
    })
  } else if (datePatterns.dayOfMonth.test(term)) {
    // Búsqueda por día del mes (14 → todos los días 14)
    const day = parseInt(term)
    
    if (day >= 1 && day <= 31) {
      searchType = 'date'
      matchedPeriod = { type: 'date', value: `Día ${day}` }
      
      filteredPayments = payments.filter(payment => {
        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
        return paymentDate.getDate() === day
      })
    } else {
      // Si no es un día válido, buscar por nombre
      searchType = 'name'
      filteredPayments = payments.filter(payment =>
        payment.expenseName.toLowerCase().includes(term)
      )
    }
    
  } else if (datePatterns.monthYear.test(term)) {
    // Búsqueda por mes y año
    const match = term.match(datePatterns.monthYear)
    if (match) {
      const monthName = match[1]
      const year = parseInt(match[2])
      const month = monthMap[monthName]
      
      if (month !== undefined) {
        searchType = 'month'
        matchedPeriod = { type: 'month', value: `${monthName} ${year}` }
        
        filteredPayments = payments.filter(payment => {
          const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
          return paymentDate.getFullYear() === year && paymentDate.getMonth() === month
        })
      }
    }
    
  } else if (datePatterns.month.test(term)) {
    // Búsqueda por mes (todos los años)
    const month = monthMap[term]
    
    if (month !== undefined) {
      searchType = 'month'
      matchedPeriod = { type: 'month', value: term }
      
      filteredPayments = payments.filter(payment => {
        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
        return paymentDate.getMonth() === month
      })
    }
  } else {
    // Búsqueda flexible por mes (mientras se escribe)
    const partialMonthMatch = getPartialMonthMatch(term)
    
    if (partialMonthMatch) {
      const month = monthMap[partialMonthMatch]
      
      if (month !== undefined) {
        searchType = 'month'
        matchedPeriod = { type: 'month', value: partialMonthMatch }
        
        filteredPayments = payments.filter(payment => {
          const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
          return paymentDate.getMonth() === month
        })
      }
    } else {
      // Búsqueda por nombre (comportamiento por defecto)
      searchType = 'name'
      filteredPayments = payments.filter(payment =>
        payment.expenseName.toLowerCase().includes(term)
      )
    }
  }

  // Detectar búsquedas combinadas (nombre + fecha)
  if (searchType === 'name' && term.includes(' ')) {
    const words = term.split(' ')
    const dateWords: string[] = []
    const nameWords: string[] = []
    
    // Separar palabras de fecha de palabras de nombre
    words.forEach(word => {
      if (datePatterns.year.test(word) || 
          datePatterns.month.test(word) || 
          monthMap[word] !== undefined) {
        dateWords.push(word)
      } else {
        nameWords.push(word)
      }
    })
    
    // Si hay tanto palabras de fecha como de nombre, hacer búsqueda combinada
    if (dateWords.length > 0 && nameWords.length > 0) {
      searchType = 'combined'
      
      // Primero filtrar por fecha
      let dateFiltered = payments
      const dateTerm = dateWords.join(' ')
      
      // Aplicar lógica de fecha a las palabras de fecha
      if (datePatterns.year.test(dateWords[0])) {
        const year = parseInt(dateWords[0])
        dateFiltered = payments.filter(payment => {
          const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
          return paymentDate.getFullYear() === year
        })
      } else if (monthMap[dateWords[0]] !== undefined) {
        const month = monthMap[dateWords[0]]
        dateFiltered = payments.filter(payment => {
          const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
          return paymentDate.getMonth() === month
        })
      }
      
      // Luego filtrar por nombre
      const nameTerm = nameWords.join(' ')
      filteredPayments = dateFiltered.filter(payment =>
        payment.expenseName.toLowerCase().includes(nameTerm)
      )
    }
  }

  return {
    payments: filteredPayments,
    searchType,
    searchTerm: term,
    matchedPeriod
  }
}

export function getSearchSuggestions(searchTerm: string): string[] {
  if (!searchTerm.trim()) return []
  
  const suggestions: string[] = []
  const term = searchTerm.toLowerCase().trim()
  
  // Sugerencias de meses
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  
  months.forEach(month => {
    if (month.startsWith(term)) {
      suggestions.push(month)
    }
  })
  
  // Sugerencias de años
  const currentYear = new Date().getFullYear()
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    if (year.toString().startsWith(term)) {
      suggestions.push(year.toString())
    }
  }
  
  return suggestions.slice(0, 5) // Máximo 5 sugerencias
}
