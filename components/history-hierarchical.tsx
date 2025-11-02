"use client"

import { smartSearch } from "@/lib/smart-search"
import { Payment } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Calendar, ChevronDown, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ReceiptViewer } from "./receipt-viewer"

interface HierarchicalHistoryProps {
  payments: Payment[]
  searchTerm: string
}

interface YearData {
  year: number
  months: MonthData[]
  totalAmount: number
  paymentsCount: number
}

interface MonthData {
  month: number
  year: number
  weeks: WeekData[]
  totalAmount: number
  paymentsCount: number
}

interface WeekData {
  weekNumber: number
  month: number
  year: number
  days: DayData[]
  totalAmount: number
  paymentsCount: number
}

interface DayData {
  date: Date
  payments: Payment[]
  totalAmount: number
  paymentsCount: number
}

export function HierarchicalHistory({ payments, searchTerm }: HierarchicalHistoryProps) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  
  // Refs para elementos específicos para scroll automático
  const yearRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const weekRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  
  // Ref para rastrear el último elemento que se expandió (para evitar scroll duplicado)
  const lastExpandedKeyRef = useRef<string | null>(null)

  // Búsqueda inteligente
  const searchResult = useMemo(() => {
    return smartSearch(payments, searchTerm)
  }, [payments, searchTerm])

  // Agrupar pagos jerárquicamente
  const hierarchicalData = useMemo(() => {
    const filteredPayments = searchResult.payments

    // Si es búsqueda por mes, agrupar de manera especial
    if (searchResult.searchType === 'month' && searchResult.matchedPeriod) {
      const monthName = searchResult.matchedPeriod.value
      const monthMap: Record<string, number> = {
        'enero': 0, 'ene': 0, 'febrero': 1, 'feb': 1, 'marzo': 2, 'mar': 2,
        'abril': 3, 'abr': 3, 'mayo': 4, 'may': 4, 'junio': 5, 'jun': 5,
        'julio': 6, 'jul': 6, 'agosto': 7, 'ago': 7, 'septiembre': 8, 'sep': 8,
        'octubre': 9, 'oct': 9, 'noviembre': 10, 'nov': 10, 'diciembre': 11, 'dic': 11
      }
      const targetMonth = monthMap[monthName]
      
      if (targetMonth !== undefined) {
        // Agrupar por año, pero solo mostrar los meses específicos
        const grouped: Record<number, Record<number, Record<number, Record<number, Payment[]>>>> = {}
        
        filteredPayments.forEach(payment => {
          const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
          const year = paymentDate.getFullYear()
          const month = paymentDate.getMonth()
          const day = paymentDate.getDate()
          
          if (month === targetMonth) {
            const firstDayOfMonth = new Date(year, month, 1)
            const firstMonday = new Date(firstDayOfMonth)
            firstMonday.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay() + 1)
            const weekNumber = Math.ceil((day + firstDayOfMonth.getDay() - 1) / 7)

            if (!grouped[year]) grouped[year] = {}
            if (!grouped[year][month]) grouped[year][month] = {}
            if (!grouped[year][month][weekNumber]) grouped[year][month][weekNumber] = {}
            if (!grouped[year][month][weekNumber][day]) grouped[year][month][weekNumber][day] = []
            
            grouped[year][month][weekNumber][day].push(payment)
          }
        })

        // Convertir a estructura jerárquica especial para meses
        const years: YearData[] = Object.keys(grouped)
          .map(Number)
          .sort((a, b) => b - a)
          .map(year => {
            const months: MonthData[] = Object.keys(grouped[year])
              .map(Number)
              .sort((a, b) => b - a)
              .map(month => {
                const weeks: WeekData[] = Object.keys(grouped[year][month])
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map(weekNumber => {
                    const days: DayData[] = Object.keys(grouped[year][month][weekNumber])
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map(day => {
                        const dayPayments = grouped[year][month][weekNumber][day]
                        return {
                          date: new Date(year, month, day),
                          payments: dayPayments,
                          totalAmount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
                          paymentsCount: dayPayments.length
                        }
                      })

                    const weekPayments = days.flatMap(d => d.payments)
                    return {
                      weekNumber,
                      month,
                      year,
                      days,
                      totalAmount: weekPayments.reduce((sum, p) => sum + p.amount, 0),
                      paymentsCount: weekPayments.length
                    }
                  })

                const monthPayments = weeks.flatMap(w => w.days.flatMap(d => d.payments))
                return {
                  month,
                  year,
                  weeks,
                  totalAmount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
                  paymentsCount: monthPayments.length
                }
              })

            const yearPayments = months.flatMap(m => m.weeks.flatMap(w => w.days.flatMap(d => d.payments)))
            return {
              year,
              months,
              totalAmount: yearPayments.reduce((sum, p) => sum + p.amount, 0),
              paymentsCount: yearPayments.length
            }
          })

        return years
      }
    }

    const grouped: Record<number, Record<number, Record<number, Record<number, Payment[]>>>> = {}

    filteredPayments.forEach(payment => {
      const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
      const year = paymentDate.getFullYear()
      const month = paymentDate.getMonth()
      const day = paymentDate.getDate()
      
      // Calcular número de semana del mes
      const firstDayOfMonth = new Date(year, month, 1)
      const firstMonday = new Date(firstDayOfMonth)
      firstMonday.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay() + 1)
      const weekNumber = Math.ceil((paymentDate.getDate() + firstDayOfMonth.getDay() - 1) / 7)

      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = {}
      if (!grouped[year][month][weekNumber]) grouped[year][month][weekNumber] = {}
      if (!grouped[year][month][weekNumber][day]) grouped[year][month][weekNumber][day] = []
      
      grouped[year][month][weekNumber][day].push(payment)
    })

    // Convertir a estructura jerárquica
    const years: YearData[] = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a) // Más reciente primero
      .map(year => {
        const months: MonthData[] = Object.keys(grouped[year])
          .map(Number)
          .sort((a, b) => b - a)
          .map(month => {
            const weeks: WeekData[] = Object.keys(grouped[year][month])
              .map(Number)
              .sort((a, b) => b - a)
              .map(weekNumber => {
                const days: DayData[] = Object.keys(grouped[year][month][weekNumber])
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map(day => {
                    const dayPayments = grouped[year][month][weekNumber][day]
                    return {
                      date: new Date(year, month, day),
                      payments: dayPayments,
                      totalAmount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
                      paymentsCount: dayPayments.length
                    }
                  })

                const weekPayments = days.flatMap(d => d.payments)
                return {
                  weekNumber,
                  month,
                  year,
                  days,
                  totalAmount: weekPayments.reduce((sum, p) => sum + p.amount, 0),
                  paymentsCount: weekPayments.length
                }
              })

            const monthPayments = weeks.flatMap(w => w.days.flatMap(d => d.payments))
            return {
              month,
              year,
              weeks,
              totalAmount: monthPayments.reduce((sum, p) => sum + p.amount, 0),
              paymentsCount: monthPayments.length
            }
          })

        const yearPayments = months.flatMap(m => m.weeks.flatMap(w => w.days.flatMap(d => d.payments)))
        return {
          year,
          months,
          totalAmount: yearPayments.reduce((sum, p) => sum + p.amount, 0),
          paymentsCount: yearPayments.length
        }
      })

    return years
  }, [searchResult.payments])

  // Función helper para scroll suave
  const scrollToElement = useCallback((element: HTMLDivElement | undefined) => {
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears)
    if (newExpanded.has(year)) {
      newExpanded.delete(year)
    } else {
      newExpanded.add(year)
    }
    setExpandedYears(newExpanded)
    
    // Auto-expandir si solo hay un mes
    if (!newExpanded.has(year)) return
    
    const yearData = hierarchicalData.find(y => y.year === year)
    if (yearData && yearData.months.length === 1) {
      const month = yearData.months[0]
      const monthKey = `${month.year}-${month.month}`
      if (!expandedMonths.has(monthKey)) {
        setExpandedMonths(new Set([...expandedMonths, monthKey]))
        
        // Auto-expandir semana si solo hay una
        if (month.weeks.length === 1) {
          const week = month.weeks[0]
          const weekKey = `${week.year}-${week.month}-${week.weekNumber}`
          setExpandedWeeks(new Set([...expandedWeeks, weekKey]))
          
          // Auto-expandir día si solo hay uno
          if (week.days.length === 1) {
            const day = week.days[0]
            const dayKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
            setExpandedDays(new Set([...expandedDays, dayKey]))
          }
        }
      }
    }
  }

  const toggleMonth = (year: number, month: number) => {
    const key = `${year}-${month}`
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedMonths(newExpanded)
    
    // Auto-expandir si solo hay una semana
    if (!newExpanded.has(key)) return
    
    const yearData = hierarchicalData.find(y => y.year === year)
    const monthData = yearData?.months.find(m => m.month === month && m.year === year)
    if (monthData && monthData.weeks.length === 1) {
      const week = monthData.weeks[0]
      const weekKey = `${week.year}-${week.month}-${week.weekNumber}`
      if (!expandedWeeks.has(weekKey)) {
        setExpandedWeeks(new Set([...expandedWeeks, weekKey]))
        
        // Auto-expandir día si solo hay uno
        if (week.days.length === 1) {
          const day = week.days[0]
          const dayKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
          setExpandedDays(new Set([...expandedDays, dayKey]))
        }
      }
    }
  }

  const toggleWeek = (year: number, month: number, weekNumber: number) => {
    const key = `${year}-${month}-${weekNumber}`
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedWeeks(newExpanded)
    
    // Auto-expandir si solo hay un día
    if (!newExpanded.has(key)) return
    
    const yearData = hierarchicalData.find(y => y.year === year)
    const monthData = yearData?.months.find(m => m.month === month && m.year === year)
    const weekData = monthData?.weeks.find(w => w.weekNumber === weekNumber)
    if (weekData && weekData.days.length === 1) {
      const day = weekData.days[0]
      const dayKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
      setExpandedDays(new Set([...expandedDays, dayKey]))
    }
  }

  const toggleDay = (year: number, month: number, day: number) => {
    const key = `${year}-${month}-${day}`
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedDays(newExpanded)
  }

  const formatMonthName = (month: number) => {
    const date = new Date(2024, month, 1)
    return date.toLocaleDateString('es-ES', { month: 'long' })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Effect para scroll automático cuando se expande el último nivel
  useEffect(() => {
    // Encontrar el último elemento expandido y hacer scroll
    let lastExpandedRef: HTMLDivElement | undefined
    let currentKey: string | null = null
    
    // Buscar en este orden: días > semanas > meses > años
    if (expandedDays.size > 0) {
      const lastDayKey = Array.from(expandedDays).slice(-1)[0]
      currentKey = `day-${lastDayKey}`
      lastExpandedRef = dayRefs.current.get(lastDayKey)
    } else if (expandedWeeks.size > 0) {
      const lastWeekKey = Array.from(expandedWeeks).slice(-1)[0]
      currentKey = `week-${lastWeekKey}`
      lastExpandedRef = weekRefs.current.get(lastWeekKey)
    } else if (expandedMonths.size > 0) {
      const lastMonthKey = Array.from(expandedMonths).slice(-1)[0]
      currentKey = `month-${lastMonthKey}`
      lastExpandedRef = monthRefs.current.get(lastMonthKey)
    } else if (expandedYears.size > 0) {
      const lastYearKey = Array.from(expandedYears).slice(-1)[0]
      currentKey = `year-${lastYearKey}`
      lastExpandedRef = yearRefs.current.get(lastYearKey)
    }
    
    // Solo hacer scroll si es un elemento diferente al último
    if (lastExpandedRef && currentKey && currentKey !== lastExpandedKeyRef.current) {
      lastExpandedKeyRef.current = currentKey
      
      // Usar requestAnimationFrame para esperar a que el DOM se actualice
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToElement(lastExpandedRef)
          }, 100)
        })
      })
    }
  }, [expandedDays, expandedWeeks, expandedMonths, expandedYears, scrollToElement])

  if (hierarchicalData.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {searchTerm ? "No se encontraron pagos" : "No hay pagos registrados"}
        </h3>
        <p className="text-muted-foreground">
          {searchTerm 
            ? `No hay pagos que coincidan con "${searchTerm}"` 
            : "Comienza agregando tus primeros gastos"
          }
        </p>
        {searchTerm && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>💡 Prueba buscar por:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Nombre del gasto: "supermercado"</li>
              <li>Mes: "octubre" o "enero"</li>
              <li>Año: "2024" o "2025"</li>
              <li>Mes y año: "octubre 2025"</li>
              <li>Combinado: "supermercado octubre"</li>
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Si es búsqueda por fecha específica (DD/MM/YYYY) o día del mes, mostrar directamente
  if (searchResult.searchType === 'date' && searchResult.matchedPeriod?.type === 'date' && 
      (searchResult.matchedPeriod.value.startsWith('Día') || searchResult.matchedPeriod.value.includes('/'))) {
    return (
      <div className="space-y-4">
        {/* Indicador de búsqueda activa */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              🔍
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Búsqueda: "{searchTerm}"
              </p>
              <p className="text-xs text-muted-foreground">
                {searchResult.matchedPeriod.value} • {searchResult.payments.length} pagos encontrados
              </p>
            </div>
          </div>
        </div>

        {/* Mostrar días directamente sin agrupar */}
        {hierarchicalData.map(yearData => 
          yearData.months.map(monthData => 
            monthData.weeks.map(weekData => 
              weekData.days.map(dayData => (
                <div key={`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`} className="space-y-2">
                  {/* Día */}
                  <div 
                    ref={(el) => el && dayRefs.current.set(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`, el)}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => toggleDay(dayData.date.getFullYear(), dayData.date.getMonth(), dayData.date.getDate())}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          📅
                        </div>
                        <div>
                          <h6 className="text-base font-semibold text-foreground">
                            {formatDate(dayData.date)}
                          </h6>
                          <p className="text-sm text-muted-foreground">
                            {dayData.paymentsCount} pagos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(dayData.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Balance</div>
                        </div>
                        {expandedDays.has(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pagos del día */}
                  {expandedDays.has(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`) && (
                    <div className="ml-4 space-y-2">
                      {dayData.payments.map(payment => {
                        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
                        const { date, time } = {
                          date: paymentDate.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          }),
                          time: paymentDate.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        }
                        
                        return (
                          <div
                            key={payment.id}
                            className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-gray-900/50 border-2 border-green-400 dark:border-green-500 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold">
                                  ✅
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-foreground">{payment.expenseName}</h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-semibold">
                                      💳 Pagado
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {payment.receiptImageId && (
                                <ReceiptViewer
                                  receiptImageId={payment.receiptImageId}
                                  expenseName={payment.expenseName}
                                  expenseAmount={payment.amount}
                                  paidAt={paymentDate}
                                />
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold text-foreground">
                                {formatCurrency(payment.amount)}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-green-600 font-medium">
                                  📅 {date} a las {time}
                                </div>
                                {payment.notes && (
                                  <div className="text-xs text-muted-foreground italic">
                                    📝 {payment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )
          )
        )}
      </div>
    )
  }

  // Si es búsqueda por mes específico, mostrar solo los meses sin agrupar por años
  if (searchResult.searchType === 'month' && searchResult.matchedPeriod) {
    return (
      <div className="space-y-4">
        {/* Indicador de búsqueda activa */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              🔍
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Búsqueda: "{searchTerm}"
              </p>
              <p className="text-xs text-muted-foreground">
                Mes {searchResult.matchedPeriod.value} • {searchResult.payments.length} pagos encontrados
              </p>
            </div>
          </div>
        </div>

        {/* Mostrar meses directamente sin años */}
        {hierarchicalData.map(yearData => 
          yearData.months.map(monthData => (
            <div key={`${monthData.year}-${monthData.month}`} className="space-y-2">
              {/* Mes */}
              <div 
                ref={(el) => el && monthRefs.current.set(`${monthData.year}-${monthData.month}`, el)}
                className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => toggleMonth(monthData.year, monthData.month)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      📅
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        {formatMonthName(monthData.month)} {monthData.year}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {monthData.paymentsCount} pagos • {monthData.weeks.length} semanas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">
                        {formatCurrency(monthData.totalAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">Balance</div>
                    </div>
                    {expandedMonths.has(`${monthData.year}-${monthData.month}`) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Semanas */}
              {expandedMonths.has(`${monthData.year}-${monthData.month}`) && (
                <div className="ml-4 space-y-2">
                  {monthData.weeks.map(weekData => (
                    <div key={`${weekData.year}-${weekData.month}-${weekData.weekNumber}`} className="space-y-2">
                      <div 
                        ref={(el) => el && weekRefs.current.set(`${weekData.year}-${weekData.month}-${weekData.weekNumber}`, el)}
                        className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-all duration-200"
                        onClick={() => toggleWeek(weekData.year, weekData.month, weekData.weekNumber)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              📅
                            </div>
                            <div>
                              <h5 className="text-base font-semibold text-foreground">
                                Semana {weekData.weekNumber}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {weekData.paymentsCount} pagos • {weekData.days.length} días
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                {formatCurrency(weekData.totalAmount)}
                              </div>
                              <div className="text-sm text-muted-foreground">Balance</div>
                            </div>
                            {expandedWeeks.has(`${weekData.year}-${weekData.month}-${weekData.weekNumber}`) ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Días y pagos */}
                      {expandedWeeks.has(`${weekData.year}-${weekData.month}-${weekData.weekNumber}`) && (
                        <div className="ml-4 space-y-2">
                          {weekData.days.map(dayData => (
                            <div key={`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`} className="space-y-2">
                              <div 
                                ref={(el) => el && dayRefs.current.set(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`, el)}
                                className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-all duration-200"
                                onClick={() => toggleDay(dayData.date.getFullYear(), dayData.date.getMonth(), dayData.date.getDate())}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                      📅
                                    </div>
                                    <div>
                                      <h6 className="text-base font-semibold text-foreground">
                                        {formatDate(dayData.date)}
                                      </h6>
                                      <p className="text-sm text-muted-foreground">
                                        {dayData.paymentsCount} pagos
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-green-600">
                                        {formatCurrency(dayData.totalAmount)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">Balance</div>
                                    </div>
                                    {expandedDays.has(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`) ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Pagos del día */}
                              {expandedDays.has(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`) && (
                                <div className="ml-4 space-y-2">
                                  {dayData.payments.map(payment => {
                                    const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
                                    const { date, time } = {
                                      date: paymentDate.toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      }),
                                      time: paymentDate.toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    }
                                    
                                    return (
                                      <div
                                        key={payment.id}
                                        className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-gray-900/50 border-2 border-green-400 dark:border-green-500 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold">
                                              ✅
                                            </div>
                                            <div>
                                              <h3 className="text-lg font-bold text-foreground">{payment.expenseName}</h3>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-semibold">
                                                  💳 Pagado
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {payment.receiptImageId && (
                                            <ReceiptViewer
                                              receiptImageId={payment.receiptImageId}
                                              expenseName={payment.expenseName}
                                              expenseAmount={payment.amount}
                                              paidAt={paymentDate}
                                            />
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between">
                                          <div className="text-2xl font-bold text-foreground">
                                            {formatCurrency(payment.amount)}
                                          </div>
                                          
                                          <div className="text-right">
                                            <div className="text-sm text-green-600 font-medium">
                                              📅 {date} a las {time}
                                            </div>
                                            {payment.notes && (
                                              <div className="text-xs text-muted-foreground italic">
                                                📝 {payment.notes}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Indicador de búsqueda activa */}
      {searchTerm && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              🔍
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Búsqueda: "{searchTerm}"
              </p>
              <p className="text-xs text-muted-foreground">
                {searchResult.searchType === 'name' && 'Por nombre de gasto'}
                {searchResult.searchType === 'year' && `Año ${searchResult.matchedPeriod?.value}`}
                {searchResult.searchType === 'month' && `Mes ${searchResult.matchedPeriod?.value}`}
                {searchResult.searchType === 'date' && `Fecha ${searchResult.matchedPeriod?.value}`}
                {searchResult.searchType === 'combined' && 'Búsqueda combinada'}
                • {searchResult.payments.length} pagos encontrados
              </p>
            </div>
          </div>
        </div>
      )}
      
      {hierarchicalData.map(yearData => (
        <div key={yearData.year} className="space-y-2">
          {/* Año */}
          <div 
            ref={(el) => el && yearRefs.current.set(yearData.year, el)}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => toggleYear(yearData.year)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  📅
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{yearData.year}</h3>
                  <p className="text-sm text-muted-foreground">
                    {yearData.paymentsCount} pagos • {yearData.months.length} meses
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(yearData.totalAmount)}
                  </div>
                  <div className="text-sm text-muted-foreground">Balance Total</div>
                </div>
                {expandedYears.has(yearData.year) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {/* Meses */}
          {expandedYears.has(yearData.year) && (
            <div className="ml-4 space-y-2">
              {yearData.months.map(monthData => (
                <div key={`${monthData.year}-${monthData.month}`} className="space-y-2">
                  <div 
                    ref={(el) => el && monthRefs.current.set(`${monthData.year}-${monthData.month}`, el)}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => toggleMonth(monthData.year, monthData.month)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          📅
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">
                            {formatMonthName(monthData.month)} {monthData.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {monthData.paymentsCount} pagos • {monthData.weeks.length} semanas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(monthData.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Balance</div>
                        </div>
                        {expandedMonths.has(`${monthData.year}-${monthData.month}`) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Semanas */}
                  {expandedMonths.has(`${monthData.year}-${monthData.month}`) && (
                    <div className="ml-4 space-y-2">
                      {monthData.weeks.map(weekData => (
                        <div key={`${weekData.year}-${weekData.month}-${weekData.weekNumber}`} className="space-y-2">
                          <div 
                            className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-all duration-200"
                            onClick={() => toggleWeek(weekData.year, weekData.month, weekData.weekNumber)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                  📅
                                </div>
                                <div>
                                  <h5 className="text-base font-semibold text-foreground">
                                    Semana {weekData.weekNumber}
                                  </h5>
                                  <p className="text-sm text-muted-foreground">
                                    {weekData.paymentsCount} pagos • {weekData.days.length} días
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">
                                    {formatCurrency(weekData.totalAmount)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">Balance</div>
                                </div>
                                {expandedWeeks.has(`${weekData.year}-${weekData.month}-${weekData.weekNumber}`) ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Días */}
                          {expandedWeeks.has(`${weekData.year}-${weekData.month}-${weekData.weekNumber}`) && (
                            <div className="ml-4 space-y-2">
                              {weekData.days.map(dayData => (
                                <div key={`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`} className="space-y-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-all duration-200"
                                    onClick={() => toggleDay(dayData.date.getFullYear(), dayData.date.getMonth(), dayData.date.getDate())}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                          📅
                                        </div>
                                        <div>
                                          <h6 className="text-base font-semibold text-foreground">
                                            {formatDate(dayData.date)}
                                          </h6>
                                          <p className="text-sm text-muted-foreground">
                                            {dayData.paymentsCount} pagos
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-green-600">
                                            {formatCurrency(dayData.totalAmount)}
                                          </div>
                                          <div className="text-sm text-muted-foreground">Balance</div>
                                        </div>
                                        {expandedDays.has(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`) ? (
                                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pagos del día */}
                                  {expandedDays.has(`${dayData.date.getFullYear()}-${dayData.date.getMonth()}-${dayData.date.getDate()}`) && (
                                    <div className="ml-4 space-y-2">
                                      {dayData.payments.map(payment => {
                                        const paymentDate = payment.paidAt instanceof Date ? payment.paidAt : new Date(payment.paidAt)
                                        const { date, time } = {
                                          date: paymentDate.toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                          }),
                                          time: paymentDate.toLocaleTimeString('es-ES', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        }
                                        
                                        return (
                                          <div
                                            key={payment.id}
                                            className="bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-green-900/20 dark:via-emerald-900/20 dark:to-gray-900/50 border-2 border-green-400 dark:border-green-500 rounded-xl p-4 transition-all duration-300 hover:scale-[1.02]"
                                          >
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-lg font-bold">
                                                  ✅
                                                </div>
                                                <div>
                                                  <h3 className="text-lg font-bold text-foreground">{payment.expenseName}</h3>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-semibold">
                                                      💳 Pagado
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              {payment.receiptImageId && (
                                                <ReceiptViewer
                                                  receiptImageId={payment.receiptImageId}
                                                  expenseName={payment.expenseName}
                                                  expenseAmount={payment.amount}
                                                  paidAt={paymentDate}
                                                />
                                              )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                              <div className="text-2xl font-bold text-foreground">
                                                {formatCurrency(payment.amount)}
                                              </div>
                                              
                                              <div className="text-right">
                                                <div className="text-sm text-green-600 font-medium">
                                                  📅 {date} a las {time}
                                                </div>
                                                {payment.notes && (
                                                  <div className="text-xs text-muted-foreground italic">
                                                    📝 {payment.notes}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
