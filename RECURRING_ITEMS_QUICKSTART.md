# Guía Rápida - Sistema de Items Recurrentes

## 🚀 Inicio Rápido

### 1. Verificar Service Worker

El Service Worker se registra automáticamente. Verifica en la consola del navegador:
```
[SW] Installing...
[SW] Caching static assets
[SW] Activating...
```

### 2. Activar Notificaciones (Opcional)

Al abrir la app por primera vez, verás un banner:
- Click en "Activar" para habilitar notificaciones push
- Las notificaciones te avisarán de pagos pendientes y vencidos

### 3. Crear tu Primer Item Recurrente

#### Ejemplo: Alquiler Mensual

1. Ve a la sección "Items" en la navegación inferior
2. Click en "Nuevo Item"
3. Completa:
   - **Nombre**: Alquiler
   - **Tipo**: Mensual
   - **Monto**: 50000
   - **Categoría**: Hogar
4. Click en "Crear Item"

✅ El sistema generará automáticamente una instancia para este mes

#### Ejemplo: Desayuno Diario

1. Ve a "Items" → "Nuevo Item"
2. Completa:
   - **Nombre**: Desayuno
   - **Tipo**: Diario
   - **Categoría**: Alimentación
   - (No requiere monto)
3. Click en "Crear Item"

✅ El item aparecerá siempre en el dashboard para que registres cada pago

#### Ejemplo: Pago Quincenal (días 5 y 20)

1. Ve a "Items" → "Nuevo Item"
2. Completa:
   - **Nombre**: Cuota del auto
   - **Tipo**: Calendario Personalizado
   - **Monto**: 15000
   - **Categoría**: Transporte
   - **Días del mes**: Selecciona 5 y 20
3. Click en "Crear Item"

✅ El sistema generará dos instancias por mes (día 5 y día 20)

### 4. Pagar Items

#### Desde el Dashboard

Todos tus items pendientes aparecen en la página principal:

**Items Diarios**: 
- Siempre visibles
- Click en $ → Ingresa monto → Confirmar

**Items con Monto Fijo**:
- Aparecen solo cuando están activos para el periodo
- Click en "Pagar" → Confirmar

#### Estados Visuales

- 🔴 **Rojo (Vencido)**: Debes pagar urgente
- 🟡 **Amarillo (Hoy)**: Vence hoy
- 🔵 **Azul (Pendiente)**: Próximamente

## 📊 Ejemplos de Uso Común

### Caso 1: Empleado con Gastos Diarios

```
Items Diarios:
- Almuerzo (varía cada día)
- Transporte (varía según uso)
- Café (varía)

Items Mensuales:
- Alquiler (fijo)
- Internet (fijo)
- Gym (fijo)
```

### Caso 2: Freelancer con Pagos Variables

```
Items Diarios:
- Comidas
- Gastos de oficina

Items de Calendario:
- Impuestos (día 20 cada mes)
- Cuota contador (día 10 cada mes)
- Seguro (día 15 cada mes)

Items Semanales:
- Limpieza oficina (lunes)
```

### Caso 3: Familia con Presupuesto

```
Items Diarios:
- Compras del día
- Gastos escolares

Items Mensuales:
- Alquiler
- Luz, Gas, Agua
- Colegio
- Obra social

Items de Calendario:
- Cuota auto (día 5)
- Cuota tarjeta (día 15)
```

## 🔔 Configurar Notificaciones

### En Chrome (Desktop)

1. Click en el ícono 🔒 en la barra de direcciones
2. Permisos → Notificaciones → Permitir

### En Chrome (Mobile)

1. Settings → Site Settings → Notifications
2. Busca tu dominio
3. Permitir notificaciones

### Desactivar Temporalmente

- Solo cierra el banner
- Las notificaciones se pausan automáticamente

## 🎯 Tips y Mejores Prácticas

### ✅ Qué Hacer

- Usa **Diarios** para gastos que varían en monto
- Usa **Mensuales** para facturas fijas
- Usa **Calendario** para múltiples pagos en el mes
- Revisa el dashboard diariamente
- Activa notificaciones para no olvidar pagos

### ❌ Qué Evitar

- No crees items mensuales para gastos variables
- No desactives items, mejor edítalos si cambió el monto
- No ignores items vencidos, págalos o elimínalos

## 🔧 Solución de Problemas

### No veo mis items en el dashboard

**Solución**: 
- Verifica que el item esté "Activo" en la configuración
- Para items no-diarios, verifica que estés en el periodo correcto
- Refresca la página

### Las notificaciones no aparecen

**Solución**:
- Verifica permisos del navegador
- Asegúrate de estar en HTTPS
- El Service Worker debe estar activo (verifica en DevTools)

### Las instancias no se generan automáticamente

**Solución**:
- El sistema verifica cada 5 minutos
- Navega entre páginas para forzar verificación
- Espera unos momentos después de crear el item

### El badge no muestra el número correcto

**Solución**:
- Refresca la página
- El contador se actualiza automáticamente cada 5 minutos

## 📱 Navegación Rápida

- **Dashboard** (`/dashboard`): Ver todos los items pendientes
- **Items** (`/recurring-items`): Configurar items recurrentes
- **Historial** (`/history`): Ver pagos realizados
- **Perfil** (`/profile`): Configuración de usuario

## 🎨 Interfaz

### Dashboard Principal

```
┌────────────────────────────────┐
│  🔔 Notificaciones             │
├────────────────────────────────┤
│  ⏰ Items Diarios              │
│  [Desayuno]  [Almuerzo]  [$]   │
├────────────────────────────────┤
│  📅 Items Mensuales            │
│  [Alquiler] - $50,000 [Pagar]  │
├────────────────────────────────┤
│  📊 Totales                    │
│  Pagado: $X  Pendiente: $Y     │
├────────────────────────────────┤
│  🧾 Gastos Fijos               │
│  [Tabla de gastos...]          │
└────────────────────────────────┘
```

### Página de Items Recurrentes

```
┌────────────────────────────────┐
│  Items Recurrentes    [+ Nuevo]│
├────────────────────────────────┤
│  Tabs:                         │
│  [Diarios] [Semanales]         │
│  [Mensuales] [Calendario]      │
├────────────────────────────────┤
│  Lista de items:               │
│  • Nombre - $Monto - Categoría │
│    [Editar] [Eliminar]         │
└────────────────────────────────┘
```

## 🚀 ¡Listo para Empezar!

1. Abre `/recurring-items`
2. Crea tus primeros items
3. Ve al dashboard y empieza a registrar pagos
4. Activa notificaciones para no olvidar nada

¿Necesitas ayuda? Revisa `RECURRING_ITEMS_SYSTEM.md` para documentación completa.

