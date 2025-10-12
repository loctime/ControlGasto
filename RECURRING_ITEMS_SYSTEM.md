# Sistema de Items Recurrentes

## Descripción General

Sistema completo de gestión de gastos recurrentes con notificaciones push y visuales. Permite configurar items diarios, semanales, mensuales y con calendario personalizado.

## Características Principales

### 1. Tipos de Items Recurrentes

#### Items Diarios
- **Comportamiento**: Siempre visibles en el dashboard
- **Monto**: Se ingresa al momento de pagar
- **Uso**: Gastos variables que ocurren diariamente (desayuno, transporte, etc.)
- **Instancias**: No generan instancias, cada pago es un registro directo

#### Items Semanales
- **Comportamiento**: Se generan el primer día de cada semana
- **Monto**: Fijo, configurado en la plantilla
- **Uso**: Gastos que se repiten semanalmente
- **Instancias**: Una instancia por semana

#### Items Mensuales
- **Comportamiento**: Se generan el día 1 de cada mes
- **Monto**: Fijo, configurado en la plantilla
- **Uso**: Gastos que se repiten mensualmente (alquiler, servicios, etc.)
- **Instancias**: Una instancia por mes

#### Items de Calendario Personalizado
- **Comportamiento**: Se generan en los días específicos configurados
- **Monto**: Fijo, configurado en la plantilla
- **Uso**: Gastos con fechas específicas (pagos quincenales, pagos en días específicos)
- **Instancias**: Una instancia por cada día configurado del mes

### 2. Sistema de Instancias

Las instancias son copias generadas automáticamente de las plantillas:

```typescript
Estado de Instancia:
- pending: Pendiente de pago
- paid: Ya fue pagado
- overdue: Vencido (fecha pasó y no fue pagado)
```

**Comportamiento de Instancias No Pagadas:**
- Cuando llega el siguiente periodo, la instancia no pagada se marca como "overdue"
- Se crea una nueva instancia para el nuevo periodo
- Las instancias vencidas permanecen visibles hasta ser pagadas

### 3. Notificaciones

#### Notificaciones Push del Navegador
- Permisos solicitados automáticamente
- Notificaciones de items vencidos
- Notificaciones de items para hoy
- Click en notificación abre la app en la sección correspondiente

#### Notificaciones Visuales en la App
- **Banner superior**: Avisos importantes (items vencidos, items para hoy)
- **Badges en navegación**: Contador de items importantes en el ícono de "Items"
- **Estados con colores**:
  - Rojo: Items vencidos
  - Amarillo/Naranja: Items para hoy
  - Azul/Gris: Items próximos

### 4. Verificación Automática

El sistema ejecuta automáticamente:
- Cada vez que se carga la app
- Cada 5 minutos mientras está abierta
- Al cambiar de página dentro de la app

Funciones automáticas:
- Generar instancias faltantes
- Actualizar estados de instancias (marcar vencidas)
- Enviar notificaciones si corresponde

## Estructura de Datos

### Firestore Collections

```
apps/
  controlgastos/
    users/
      {userId}/
        recurring_items/          # Plantillas de items recurrentes
          {itemId}
            - name: string
            - amount?: number
            - category: ExpenseCategory
            - recurrenceType: 'daily' | 'weekly' | 'monthly' | 'custom_calendar'
            - customDays?: number[]
            - weekDay?: number
            - isActive: boolean
            
        recurring_items_instances/  # Instancias generadas
          {instanceId}
            - recurringItemId: string
            - itemName: string
            - amount: number
            - dueDate: Date
            - status: 'pending' | 'paid' | 'overdue'
            - periodStart: Date
            - periodEnd: Date
            
        payments/                   # Historial de pagos (ya existía)
          {paymentId}
```

## Componentes Principales

### 1. `RecurringItemsManager`
Componente de gestión completa con tabs para cada tipo de item.

**Ubicación**: `/recurring-items`

**Funcionalidades**:
- Crear items recurrentes
- Editar items existentes
- Eliminar items
- Activar/desactivar items
- Selector de días del mes para calendario personalizado

### 2. `PendingItemsCard`
Muestra todos los items pendientes organizados por tipo.

**Ubicación**: Dashboard principal

**Funcionalidades**:
- Mostrar items diarios (siempre visibles)
- Mostrar instancias pendientes y vencidas
- Botones de pago rápido
- Estados visuales (pendiente, hoy, vencido)

### 3. `NotificationsBanner`
Banner superior con avisos importantes.

**Ubicación**: Dashboard principal

**Funcionalidades**:
- Solicitar permisos de notificaciones
- Avisar sobre items vencidos
- Avisar sobre items para hoy
- Botón para ir a pagar directamente

### 4. `BottomNav` (actualizado)
Navegación inferior con badges de notificaciones.

**Funcionalidades**:
- Badge numérico en ícono "Items"
- Color del badge según prioridad
- Contador de items importantes

## Servicios

### `RecurringItemsService`
Servicio principal para gestionar items recurrentes.

**Métodos principales**:
```typescript
// Gestión de plantillas
createRecurringItem()
updateRecurringItem()
deleteRecurringItem()
getAllRecurringItems()
getDailyItems()

// Gestión de instancias
generateInstancesForItem()
checkAndGenerateNewPeriods()
getActiveInstances()
markInstanceAsPaid()

// Pago de items diarios
payDailyItem()

// Estadísticas
getRecurringItemsStats()
```

### `NotificationsService`
Servicio para gestionar notificaciones push y permisos.

**Métodos principales**:
```typescript
// Permisos
requestNotificationPermission()
hasNotificationPermission()

// Notificaciones
sendPushNotification()
checkDueItems()
notifyOverdueItems()
notifyDueToday()

// Service Worker
registerServiceWorker()
```

## Hooks

### `useNotifications`
Hook para gestionar notificaciones en componentes React.

**Retorna**:
```typescript
{
  stats: NotificationStats
  instances: RecurringItemInstance[]
  permission: NotificationPermission
  loading: boolean
  requestPermission: () => Promise<boolean>
  refresh: () => Promise<void>
  getBadgeVariant: () => "default" | "destructive" | "secondary"
  getImportantCount: () => number
  getNotificationMessage: () => string | null
  hasNotifications: boolean
  hasImportantNotifications: boolean
}
```

### `useAutoScheduler`
Hook que ejecuta verificaciones automáticas en segundo plano.

**Uso**: Se ejecuta automáticamente en dashboard y páginas principales.

## Flujo de Trabajo

### Crear un Item Recurrente

1. Usuario navega a `/recurring-items`
2. Click en "Nuevo Item"
3. Completa formulario:
   - Nombre
   - Tipo de recurrencia
   - Monto (excepto para diarios)
   - Categoría
   - Configuración específica (día de semana, días del mes)
4. Sistema crea la plantilla
5. Sistema genera instancias automáticamente (excepto diarios)

### Pagar un Item Diario

1. Usuario ve item diario en dashboard
2. Click en botón "Pagar"
3. Ingresa monto
4. Opcionalmente agrega notas
5. Confirma pago
6. Sistema crea registro en historial de pagos
7. Item permanece visible para futuros pagos

### Pagar una Instancia (Semanal/Mensual/Calendario)

1. Usuario ve instancia pendiente en dashboard
2. Click en botón "Pagar"
3. Sistema muestra monto configurado
4. Usuario confirma o agrega notas
5. Sistema marca instancia como pagada
6. Sistema crea registro en historial de pagos
7. Instancia desaparece hasta próximo periodo

### Verificación Automática

1. Usuario abre la app o está navegando
2. `useAutoScheduler` se ejecuta automáticamente
3. Sistema verifica si hay nuevos periodos
4. Genera instancias faltantes
5. Actualiza estados de instancias vencidas
6. Calcula estadísticas de notificaciones
7. Envía notificaciones push si corresponde

## Seguridad (Firestore Rules)

```javascript
// Solo el usuario propietario puede acceder a sus items
match /apps/controlgastos/users/{userId}/recurring_items/{itemId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId && request.resource.data.userId == userId;
  allow update, delete: if request.auth.uid == userId && resource.data.userId == userId;
}

// Mismo esquema para instancias
match /apps/controlgastos/users/{userId}/recurring_items_instances/{instanceId} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId && request.resource.data.userId == userId;
  allow update, delete: if request.auth.uid == userId && resource.data.userId == userId;
}
```

## Service Worker

El Service Worker (`public/sw.js`) ha sido actualizado para:
- Cachear la página `/recurring-items`
- Manejar notificaciones push
- Responder a clicks en notificaciones
- Abrir la app en la sección correcta según el tipo de notificación

## Consideraciones Técnicas

### Rendimiento
- Las consultas a Firestore están optimizadas con índices
- Los componentes usan memoización para cálculos pesados
- La verificación automática tiene throttling (cada 5 minutos)

### PWA
- Las notificaciones push solo funcionan en HTTPS
- El Service Worker se registra automáticamente al cargar la app
- Compatible con instalación como PWA

### Manejo de Fechas
- Se usa `date-fns` para todas las operaciones de fechas
- Locale configurado en español
- Soporte para diferentes zonas horarias

### Escalabilidad
- El sistema puede manejar cientos de items recurrentes
- Las instancias se generan bajo demanda
- Cleanup automático de instancias antiguas pagadas (futuro)

## Roadmap Futuro

- [ ] Notificaciones por email
- [ ] Exportar historial de items recurrentes
- [ ] Gráficos de gastos recurrentes vs variables
- [ ] Predicción de gastos futuros
- [ ] Alertas de presupuesto excedido
- [ ] Compartir items recurrentes entre usuarios
- [ ] Templates predefinidos de items comunes

## Soporte

Para reportar bugs o solicitar funcionalidades, crear un issue en el repositorio del proyecto.

