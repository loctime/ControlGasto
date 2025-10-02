# 🎨 Ejemplos de Implementación

## 📱 Componentes Reales

### 1. Header de Gastos
```tsx
// ✅ Implementación actual
export function ExpensesHeader({ totalPaid, totalPending, totalExpenses }) {
  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          Gastos Fijos
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tus gastos mensuales
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-r from-secondary to-accent rounded-xl p-6 border border-border">
        <div className="grid grid-cols-3 gap-6">
          {/* Pagado */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-paid/10 rounded-full mb-3">
              <CheckCircle className="w-6 h-6 text-paid" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pagado</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalPaid)}</p>
          </div>

          {/* Pendiente */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pending/10 rounded-full mb-3">
              <Clock className="w-6 h-6 text-pending" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Pendiente</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalPending)}</p>
          </div>

          {/* Total */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-3">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Total</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. Tabla de Gastos
```tsx
// ✅ Implementación actual
export function ExpensesTable({ expenses, onTogglePaid }) {
  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className={`
            group rounded-lg border transition-all duration-200 hover:shadow-sm
            ${expense.paid 
              ? "bg-paid/5 border-paid/20 hover:border-paid/30" 
              : "bg-pending/5 border-pending/20 hover:border-pending/30"
            }
          `}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground truncate">
                    {expense.name}
                  </h3>
                  <Badge 
                    className={`
                      ${expense.paid 
                        ? "bg-paid/20 text-paid" 
                        : "bg-pending/20 text-pending"
                      }
                    `}
                  >
                    {expense.paid ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {expense.category}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
              </div>

              <Button
                className={`
                  ${expense.paid 
                    ? "border-pending/30 text-pending hover:bg-pending/10" 
                    : "bg-paid hover:bg-paid/90 text-paid-foreground"
                  }
                `}
                onClick={() => onTogglePaid(expense.id, expense.paid)}
              >
                {expense.paid ? "Pendiente" : "Pagar"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 3. Navegación Inferior
```tsx
// ✅ Implementación actual
export function BottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

## 🎨 Patrones de Diseño

### 1. Tarjeta con Estado
```tsx
// Patrón: Tarjeta que cambia color según estado
<div className={`
  rounded-lg border p-4 transition-all duration-200
  ${status === 'success' 
    ? "bg-success/5 border-success/20 hover:border-success/30" 
    : status === 'warning'
    ? "bg-warning/5 border-warning/20 hover:border-warning/30"
    : "bg-muted/5 border-border hover:border-border/50"
  }
`}>
  <div className="flex items-center gap-2">
    <Icon className={`
      w-5 h-5
      ${status === 'success' ? "text-success" : 
        status === 'warning' ? "text-warning" : 
        "text-muted-foreground"}
    `} />
    <span className="font-medium text-foreground">{title}</span>
  </div>
</div>
```

### 2. Botón con Variantes
```tsx
// Patrón: Botón que cambia según acción
<Button
  className={`
    ${action === 'save' 
      ? "bg-success hover:bg-success/90 text-success-foreground" 
      : action === 'delete'
      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
      : "bg-primary hover:bg-primary/90 text-primary-foreground"
    }
  `}
>
  {action === 'save' ? 'Guardar' : 
   action === 'delete' ? 'Eliminar' : 'Acción'}
</Button>
```

### 3. Formulario con Validación
```tsx
// Patrón: Campo que cambia según validación
<Input
  className={`
    ${error 
      ? "border-destructive focus:border-destructive focus:ring-destructive" 
      : "border-border focus:border-primary focus:ring-primary"
    }
  `}
  placeholder="Campo de entrada"
/>
{error && (
  <p className="text-sm text-destructive mt-1">{error}</p>
)}
```

### 4. Lista con Categorías
```tsx
// Patrón: Lista con colores por categoría
{items.map((item) => (
  <div
    key={item.id}
    className={`
      rounded-lg border p-3 transition-colors
      bg-category-${item.category}/5 
      border-category-${item.category}/20 
      hover:border-category-${item.category}/30
    `}
  >
    <div className="flex items-center gap-2">
      <div className={`
        w-3 h-3 rounded-full 
        bg-category-${item.category}
      `} />
      <span className="text-foreground">{item.name}</span>
    </div>
  </div>
))}
```

## 🔧 Utilidades Personalizadas

### 1. Función Helper para Estados
```tsx
// utils/colors.ts
export const getStatusColors = (status: 'paid' | 'pending' | 'overdue') => {
  switch (status) {
    case 'paid':
      return {
        bg: 'bg-paid/5',
        border: 'border-paid/20',
        text: 'text-paid',
        hover: 'hover:border-paid/30'
      }
    case 'pending':
      return {
        bg: 'bg-pending/5',
        border: 'border-pending/20',
        text: 'text-pending',
        hover: 'hover:border-pending/30'
      }
    case 'overdue':
      return {
        bg: 'bg-destructive/5',
        border: 'border-destructive/20',
        text: 'text-destructive',
        hover: 'hover:border-destructive/30'
      }
    default:
      return {
        bg: 'bg-muted/5',
        border: 'border-border',
        text: 'text-muted-foreground',
        hover: 'hover:border-border/50'
      }
  }
}

// Uso en componente
const colors = getStatusColors(expense.status)
<div className={`rounded-lg border p-4 ${colors.bg} ${colors.border} ${colors.hover}`}>
```

### 2. Hook para Colores de Categoría
```tsx
// hooks/useCategoryColors.ts
export const useCategoryColors = (category: string) => {
  const categoryColors = {
    hogar: 'category-hogar',
    transporte: 'category-transporte',
    alimentacion: 'category-alimentacion',
    servicios: 'category-servicios',
    entretenimiento: 'category-entretenimiento',
    salud: 'category-salud',
    otros: 'category-otros'
  }
  
  const colorClass = categoryColors[category] || 'category-otros'
  
  return {
    bg: `bg-${colorClass}/5`,
    border: `border-${colorClass}/20`,
    text: `text-${colorClass}`,
    hover: `hover:border-${colorClass}/30`
  }
}

// Uso en componente
const colors = useCategoryColors(expense.category)
<div className={`rounded-lg border p-3 ${colors.bg} ${colors.border} ${colors.hover}`}>
```

## 🎯 Casos de Uso Avanzados

### 1. Tema Personalizado por Usuario
```tsx
// Implementación de tema personalizado
const userTheme = {
  primary: 'blue',
  accent: 'purple',
  success: 'green'
}

<div className={`
  bg-${userTheme.primary}/10 
  border-${userTheme.primary}/20 
  text-${userTheme.primary}
`}>
  Contenido personalizado
</div>
```

### 2. Animaciones con Colores
```tsx
// Transiciones suaves entre estados
<div className={`
  rounded-lg border p-4 transition-all duration-300
  ${isHovered 
    ? "bg-primary/10 border-primary/30 shadow-lg" 
    : "bg-card border-border"
  }
`}>
  Contenido con animación
</div>
```

### 3. Colores Condicionales Complejos
```tsx
// Lógica compleja de colores
const getExpenseColors = (expense) => {
  if (expense.paid) {
    return {
      card: "bg-paid/5 border-paid/20 hover:border-paid/30",
      badge: "bg-paid/20 text-paid",
      button: "border-pending/30 text-pending hover:bg-pending/10"
    }
  } else if (expense.overdue) {
    return {
      card: "bg-destructive/5 border-destructive/20 hover:border-destructive/30",
      badge: "bg-destructive/20 text-destructive",
      button: "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
    }
  } else {
    return {
      card: "bg-pending/5 border-pending/20 hover:border-pending/30",
      badge: "bg-pending/20 text-pending",
      button: "bg-paid hover:bg-paid/90 text-paid-foreground"
    }
  }
}
```

---

**💡 Tip**: Estos ejemplos muestran cómo implementar el sistema de colores de manera consistente y escalable en toda la aplicación.
