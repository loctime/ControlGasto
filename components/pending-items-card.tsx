"use client"

import { RecurringItemsService } from '@/lib/recurring-items-service'
import { RecurrenceType, RecurringItem, RecurringItemInstance } from '@/lib/types'
import { format, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './auth-provider'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

interface PendingItemsCardProps {
  filterByRecurrence?: RecurrenceType // Filtrar por tipo de recurrencia
}

export function PendingItemsCard({ filterByRecurrence }: PendingItemsCardProps = {}) {
  const { user } = useAuth()
  const [dailyItems, setDailyItems] = useState<RecurringItem[]>([])
  const [instances, setInstances] = useState<RecurringItemInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentDialog, setPaymentDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RecurringItem | RecurringItemInstance | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Filtrar items según el tipo de recurrencia
  const filteredDailyItems = useMemo(() => {
    if (!filterByRecurrence) return dailyItems
    return dailyItems.filter(item => item.recurrenceType === filterByRecurrence)
  }, [dailyItems, filterByRecurrence])

  const filteredInstances = useMemo(() => {
    if (!filterByRecurrence) return instances
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return instances.filter(instance => {
      // Filtrar por tipo de recurrencia
      if (instance.recurrenceType !== filterByRecurrence) return false
      
      // Filtrar por fechas relevantes según el período
      const dueDate = new Date(instance.dueDate)
      
      switch (filterByRecurrence) {
        case 'daily':
          // Solo items que vencen hoy o ya vencieron
          return dueDate <= today
        case 'weekly':
          // Solo items que vencen en los próximos 7 días o ya vencieron
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return dueDate >= weekAgo && dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        case 'monthly':
          // Solo items que vencen este mes o ya vencieron
          const thisMonth = now.getMonth()
          const thisYear = now.getFullYear()
          return dueDate.getMonth() === thisMonth && dueDate.getFullYear() === thisYear
        default:
          return true
      }
    })
  }, [instances, filterByRecurrence])

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const service = new RecurringItemsService(user.uid)
      
      // Cargar items diarios
      const daily = await service.getDailyItems()
      setDailyItems(daily)

      // Cargar instancias pendientes/vencidas
      const activeInstances = await service.getActiveInstances()
      setInstances(activeInstances)
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar los items')
    } finally {
      setLoading(false)
    }
  }

  const handlePayDailyItem = (item: RecurringItem) => {
    setSelectedItem(item)
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentDialog(true)
  }

  const handlePayInstance = (instance: RecurringItemInstance) => {
    setSelectedItem(instance)
    setPaymentAmount(instance.amount.toString())
    setPaymentNotes('')
    setPaymentDialog(true)
  }

  const handleConfirmPayment = async () => {
    if (!user?.uid || !selectedItem) return

    try {
      const service = new RecurringItemsService(user.uid)

      // Validar monto
      const amount = parseFloat(paymentAmount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Por favor ingresa un monto válido')
        return
      }

      // Determinar si es item diario o instancia
      if ('name' in selectedItem) {
        // Es un item diario (RecurringItem)
        const item = selectedItem as RecurringItem
        await service.payDailyItem(
          item.id,
          item.name,
          amount,
          item.category,
          undefined,
          paymentNotes || undefined
        )
        toast.success(`${item.name} pagado correctamente`)
      } else {
        // Es una instancia
        const instance = selectedItem as RecurringItemInstance
        await service.markInstanceAsPaid(
          instance.id,
          undefined,
          paymentNotes || undefined
        )
        toast.success(`${instance.itemName} pagado correctamente`)
      }

      setPaymentDialog(false)
      setSelectedItem(null)
      await loadData()
    } catch (error) {
      console.error('Error procesando pago:', error)
      toast.error('Error al procesar el pago')
    }
  }

  const getInstanceStatus = (instance: RecurringItemInstance): { 
    label: string; 
    variant: "default" | "destructive" | "secondary"; 
    icon: React.ReactNode 
  } => {
    const dueDate = new Date(instance.dueDate)
    
    if (instance.status === 'overdue' || (isPast(dueDate) && !isToday(dueDate))) {
      return {
        label: 'Vencido',
        variant: 'destructive',
        icon: <AlertCircle className="h-4 w-4" />
      }
    }
    
    if (isToday(dueDate)) {
      return {
        label: 'Hoy',
        variant: 'default',
        icon: <Clock className="h-4 w-4" />
      }
    }
    
    return {
      label: 'Pendiente',
      variant: 'secondary',
      icon: <Calendar className="h-4 w-4" />
    }
  }

  const getRecurrenceIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Clock className="h-4 w-4" />
      case 'weekly': return <Calendar className="h-4 w-4" />
      case 'monthly': return <CalendarDays className="h-4 w-4" />
      case 'custom_calendar': return <CalendarClock className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const groupInstancesByType = () => {
    return {
      weekly: filteredInstances.filter(i => i.recurrenceType === 'weekly'),
      monthly: filteredInstances.filter(i => i.recurrenceType === 'monthly'),
      calendar: filteredInstances.filter(i => i.recurrenceType === 'custom_calendar')
    }
  }

  const grouped = groupInstancesByType()
  const hasAnyItems = filteredDailyItems.length > 0 || filteredInstances.length > 0

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Cargando items pendientes...</div>
        </CardContent>
      </Card>
    )
  }

  if (!hasAnyItems) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Items Pendientes</CardTitle>
          <CardDescription>No hay items pendientes por pagar</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Items Diarios */}
        {filteredDailyItems.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <CardTitle>Items Diarios</CardTitle>
              </div>
              <CardDescription>
                Gastos que puedes registrar en cualquier momento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDailyItems.map(item => (
                  <Card key={item.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <Badge variant="secondary" className="mt-1">
                            {item.category}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handlePayDailyItem(item)}
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Semanales */}
        {grouped.weekly.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Items Semanales</CardTitle>
              </div>
              <CardDescription>
                Gastos programados para esta semana
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.weekly.map(instance => {
                  const status = getInstanceStatus(instance)
                  return (
                    <Card key={instance.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{instance.itemName}</h4>
                              <Badge variant={status.variant} className="flex items-center gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">
                                ${instance.amount.toLocaleString('es-AR')}
                              </span>
                              <span>
                                Vence: {format(new Date(instance.dueDate), "EEEE d 'de' MMMM", { locale: es })}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handlePayInstance(instance)}
                            variant={status.variant === 'destructive' ? 'destructive' : 'default'}
                          >
                            Pagar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items Mensuales */}
        {grouped.monthly.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                <CardTitle>Items Mensuales</CardTitle>
              </div>
              <CardDescription>
                Gastos programados para este mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.monthly.map(instance => {
                  const status = getInstanceStatus(instance)
                  return (
                    <Card key={instance.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{instance.itemName}</h4>
                              <Badge variant={status.variant} className="flex items-center gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">
                                ${instance.amount.toLocaleString('es-AR')}
                              </span>
                              <span>
                                Vence: {format(new Date(instance.dueDate), "d 'de' MMMM", { locale: es })}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handlePayInstance(instance)}
                            variant={status.variant === 'destructive' ? 'destructive' : 'default'}
                          >
                            Pagar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items de Calendario Personalizado */}
        {grouped.calendar.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                <CardTitle>Calendario de Pagos</CardTitle>
              </div>
              <CardDescription>
                Gastos programados en tu calendario personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {grouped.calendar.map(instance => {
                  const status = getInstanceStatus(instance)
                  return (
                    <Card key={instance.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{instance.itemName}</h4>
                              <Badge variant={status.variant} className="flex items-center gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">
                                ${instance.amount.toLocaleString('es-AR')}
                              </span>
                              <span>
                                Vence: {format(new Date(instance.dueDate), "d 'de' MMMM", { locale: es })}
                              </span>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handlePayInstance(instance)}
                            variant={status.variant === 'destructive' ? 'destructive' : 'default'}
                          >
                            Pagar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo de Pago */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {selectedItem && 'name' in selectedItem 
                ? `Ingresa el monto pagado para: ${selectedItem.name}`
                : selectedItem && 'itemName' in selectedItem
                ? `Confirma el pago de: ${selectedItem.itemName}`
                : 'Ingresa los detalles del pago'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                disabled={selectedItem ? 'itemName' in selectedItem : false}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Agregar notas adicionales..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleConfirmPayment} className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Pago
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setPaymentDialog(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

