"use client"

import { RecurringItemsService } from '@/lib/recurring-items-service'
import { ExpenseCategory, RecurrenceType, RecurringItem } from '@/lib/types'
import {
    Calendar,
    CalendarClock,
    CalendarDays,
    Check,
    Clock,
    Edit,
    Plus,
    Trash2,
    X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from './auth-provider'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'hogar', label: 'Hogar' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'alimentacion', label: 'Alimentación' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'entretenimiento', label: 'Entretenimiento' },
  { value: 'salud', label: 'Salud' },
  { value: 'otros', label: 'Otros' }
]

const WEEK_DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
]

interface ItemFormData {
  name: string
  amount: string
  category: ExpenseCategory
  recurrenceType: RecurrenceType
  weekDay?: number
  monthDay?: number
  customDays: number[]
  isActive: boolean
}

export function RecurringItemsManager() {
  const { user } = useAuth()
  const [items, setItems] = useState<RecurringItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [currentTab, setCurrentTab] = useState<RecurrenceType>('daily')

  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    amount: '',
    category: 'otros',
    recurrenceType: 'daily',
    customDays: [],
    isActive: true
  })

  useEffect(() => {
    loadItems()
  }, [user])

  const loadItems = async () => {
    if (!user?.uid) return

    try {
      setLoading(true)
      const service = new RecurringItemsService(user.uid)
      const allItems = await service.getAllRecurringItems()
      setItems(allItems)
    } catch (error) {
      console.error('Error cargando items:', error)
      toast.error('Error al cargar los items')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'otros',
      recurrenceType: currentTab,
      customDays: [],
      isActive: true
    })
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    try {
      const service = new RecurringItemsService(user.uid)

      // Validaciones
      if (!formData.name.trim()) {
        toast.error('El nombre es requerido')
        return
      }

      if (formData.recurrenceType !== 'daily' && !formData.amount) {
        toast.error('El monto es requerido para items no diarios')
        return
      }

      if (formData.recurrenceType === 'custom_calendar' && formData.customDays.length === 0) {
        toast.error('Debes seleccionar al menos un día del mes')
        return
      }

      if (formData.recurrenceType === 'monthly' && !formData.monthDay) {
        toast.error('Debes seleccionar el día del mes para items mensuales')
        return
      }

      const itemData: any = {
        name: formData.name.trim(),
        category: formData.category,
        recurrenceType: formData.recurrenceType,
        isActive: formData.isActive
      }

      // Solo agregar campos opcionales si tienen valor
      if (formData.amount) {
        itemData.amount = parseFloat(formData.amount)
      }

      if (formData.recurrenceType === 'weekly') {
        itemData.weekDay = formData.weekDay ?? 1
      }

      if (formData.recurrenceType === 'monthly' && formData.monthDay) {
        itemData.monthDay = formData.monthDay
      }

      if (formData.recurrenceType === 'custom_calendar' && formData.customDays.length > 0) {
        itemData.customDays = formData.customDays
      }

      if (editingId) {
        await service.updateRecurringItem(editingId, itemData)
        toast.success('Item actualizado correctamente')
      } else {
        await service.createRecurringItem(itemData)
        toast.success('Item creado correctamente')
      }

      resetForm()
      setShowDialog(false)
      await loadItems()
    } catch (error) {
      console.error('Error guardando item:', error)
      toast.error('Error al guardar el item')
    }
  }

  const handleEdit = (item: RecurringItem) => {
    setFormData({
      name: item.name,
      amount: item.amount?.toString() || '',
      category: item.category,
      recurrenceType: item.recurrenceType,
      weekDay: item.weekDay,
      monthDay: item.monthDay,
      customDays: item.customDays || [],
      isActive: item.isActive
    })
    setEditingId(item.id)
    setShowDialog(true)
  }

  const handleDelete = async (itemId: string) => {
    if (!user?.uid) return
    if (!confirm('¿Estás seguro de eliminar este item? Se eliminarán también sus instancias pendientes.')) return

    try {
      const service = new RecurringItemsService(user.uid)
      await service.deleteRecurringItem(itemId)
      toast.success('Item eliminado correctamente')
      await loadItems()
    } catch (error) {
      console.error('Error eliminando item:', error)
      toast.error('Error al eliminar el item')
    }
  }

  const toggleDaySelection = (day: number) => {
    setFormData(prev => {
      const customDays = prev.customDays.includes(day)
        ? prev.customDays.filter(d => d !== day)
        : [...prev.customDays, day].sort((a, b) => a - b)
      return { ...prev, customDays }
    })
  }

  const filterItemsByType = (type: RecurrenceType) => {
    return items.filter(item => item.recurrenceType === type)
  }

  const getRecurrenceIcon = (type: RecurrenceType) => {
    switch (type) {
      case 'daily': return <Clock className="h-4 w-4" />
      case 'weekly': return <Calendar className="h-4 w-4" />
      case 'monthly': return <CalendarDays className="h-4 w-4" />
      case 'custom_calendar': return <CalendarClock className="h-4 w-4" />
    }
  }

  const ItemsList = ({ type }: { type: RecurrenceType }) => {
    const filteredItems = filterItemsByType(type)

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 animate-pulse">
            📝
          </div>
          <p className="text-muted-foreground">No hay items de este tipo configurados</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className="card-float bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Efectos de fondo animados */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-lg animate-pulse"></div>
            
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center text-white text-sm font-bold animate-bounce-gentle">
                      {getRecurrenceIcon(type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{item.name}</h4>
                      {!item.isActive && (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-semibold">
                          ⏸️ Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {item.amount && (
                      <div className="flex items-center gap-1">
                        <span className="text-primary font-bold">💰</span>
                        <span className="font-bold text-foreground">${item.amount.toLocaleString('es-AR')}</span>
                      </div>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full font-semibold">
                      {CATEGORIES.find(c => c.value === item.category)?.label}
                    </span>
                    {item.recurrenceType === 'weekly' && item.weekDay !== undefined && (
                      <span className="text-xs text-muted-foreground">📅 {WEEK_DAYS.find(d => d.value === item.weekDay)?.label}</span>
                    )}
                    {item.recurrenceType === 'monthly' && item.monthDay !== undefined && (
                      <span className="text-xs text-muted-foreground">📅 Día {item.monthDay}</span>
                    )}
                    {item.recurrenceType === 'custom_calendar' && item.customDays && (
                      <span className="text-xs text-muted-foreground">🗓️ Días: {item.customDays.join(', ')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header moderno */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-lg animate-bounce-gentle">
                🔄
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Items Recurrentes
                </h2>
                <p className="text-sm text-muted-foreground">Configura tus gastos diarios, semanales, mensuales y personalizados</p>
              </div>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => { resetForm(); setFormData(prev => ({ ...prev, recurrenceType: currentTab })) }}
                  className="btn-modern px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Editar Item' : 'Nuevo Item Recurrente'}</DialogTitle>
                  <DialogDescription>
                    {formData.recurrenceType === 'daily' && 'Los items diarios aparecen siempre en el dashboard. El monto se ingresa al pagar.'}
                    {formData.recurrenceType === 'weekly' && 'Los items semanales aparecen el día de la semana que configures.'}
                    {formData.recurrenceType === 'monthly' && 'Los items mensuales aparecen el día del mes que configures.'}
                    {formData.recurrenceType === 'custom_calendar' && 'Selecciona los días específicos del mes en que se debe pagar este item.'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Desayuno, Alquiler, Internet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrenceType">Tipo de Recurrencia</Label>
                    <Select 
                      value={formData.recurrenceType}
                      onValueChange={(value: RecurrenceType) => setFormData(prev => ({ ...prev, recurrenceType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diario</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="custom_calendar">Calendario Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurrenceType !== 'daily' && (
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select 
                      value={formData.category}
                      onValueChange={(value: ExpenseCategory) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurrenceType === 'weekly' && (
                    <div className="space-y-2">
                      <Label htmlFor="weekDay">Día de la Semana</Label>
                      <Select 
                        value={formData.weekDay?.toString() || '1'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, weekDay: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEK_DAYS.map(day => (
                            <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.recurrenceType === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="monthDay">Día del Mes</Label>
                      <Select 
                        value={formData.monthDay?.toString() || '1'}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, monthDay: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <SelectItem key={day} value={day.toString()}>Día {day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.recurrenceType === 'custom_calendar' && (
                    <div className="space-y-2">
                      <Label>Días del Mes</Label>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <Button
                            key={day}
                            type="button"
                            variant={formData.customDays.includes(day) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleDaySelection(day)}
                            className="h-10"
                          >
                            {day}
                          </Button>
                        ))}
                      </div>
                      {formData.customDays.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Días seleccionados: {formData.customDays.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="isActive">Activo</Label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      {editingId ? 'Guardar Cambios' : 'Crear Item'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => { resetForm(); setShowDialog(false) }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Tabs modernos */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5 rounded-2xl blur-xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-xl">
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as RecurrenceType)}>
            <TabsList className="grid w-full grid-cols-4 bg-transparent">
              <TabsTrigger value="daily" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all duration-300">
                <Clock className="h-4 w-4" />
                Diarios ({filterItemsByType('daily').length})
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all duration-300">
                <Calendar className="h-4 w-4" />
                Semanales ({filterItemsByType('weekly').length})
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all duration-300">
                <CalendarDays className="h-4 w-4" />
                Mensuales ({filterItemsByType('monthly').length})
              </TabsTrigger>
              <TabsTrigger value="custom_calendar" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary transition-all duration-300">
                <CalendarClock className="h-4 w-4" />
                Calendario ({filterItemsByType('custom_calendar').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-900/10 dark:via-indigo-900/10 dark:to-purple-900/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-bounce-gentle">
                      ⏰
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Items Diarios
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gastos que puedes registrar en cualquier momento. Aparecen siempre en el dashboard.
                      </p>
                    </div>
                  </div>
                  {loading ? <p className="text-center py-4">Cargando...</p> : <ItemsList type="daily" />}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 via-emerald-50/50 to-teal-50/50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-bounce-gentle">
                      📅
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        Items Semanales
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gastos que se repiten cada semana en el día que configures.
                      </p>
                    </div>
                  </div>
                  {loading ? <p className="text-center py-4">Cargando...</p> : <ItemsList type="weekly" />}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-50/50 via-amber-50/50 to-yellow-50/50 dark:from-orange-900/10 dark:via-amber-900/10 dark:to-yellow-900/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-bounce-gentle">
                      📊
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Items Mensuales
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gastos que se repiten el día del mes que configures.
                      </p>
                    </div>
                  </div>
                  {loading ? <p className="text-center py-4">Cargando...</p> : <ItemsList type="monthly" />}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom_calendar" className="space-y-4">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-pink-50/50 to-rose-50/50 dark:from-purple-900/10 dark:via-pink-900/10 dark:to-rose-900/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg animate-bounce-gentle">
                      🗓️
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Calendario Personalizado
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Gastos que se repiten en días específicos del mes que tú configures.
                      </p>
                    </div>
                  </div>
                  {loading ? <p className="text-center py-4">Cargando...</p> : <ItemsList type="custom_calendar" />}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
