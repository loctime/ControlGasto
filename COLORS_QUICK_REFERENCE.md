# 🎨 Referencia Rápida de Colores

## 🚀 Uso Inmediato

### Colores Base
```tsx
// Fondos
bg-background          // Fondo principal
bg-card               // Fondo de tarjetas
bg-secondary          // Fondo secundario
bg-muted              // Fondo deshabilitado

// Texto
text-foreground       // Texto principal
text-muted-foreground // Texto secundario
text-primary          // Texto destacado

// Bordes
border-border         // Borde estándar
border-primary        // Borde destacado
```

### Estados de Gastos
```tsx
// Gastos Pagados (Verde)
bg-paid               // Fondo verde
text-paid             // Texto verde
bg-paid/10            // Fondo verde suave
border-paid/20        // Borde verde suave

// Gastos Pendientes (Amarillo)
bg-pending            // Fondo amarillo
text-pending          // Texto amarillo
bg-pending/10          // Fondo amarillo suave
border-pending/20      // Borde amarillo suave
```

### Colores de Estado
```tsx
// Éxito
bg-success text-success-foreground

// Advertencia
bg-warning text-warning-foreground

// Error
bg-destructive text-destructive-foreground

// Información
bg-info text-info-foreground
```

### Categorías
```tsx
// Por categoría
bg-category-hogar
bg-category-transporte
bg-category-alimentacion
bg-category-servicios
bg-category-entretenimiento
bg-category-salud
bg-category-otros
```

## 🎯 Patrones Comunes

### Tarjeta de Gasto
```tsx
<div className={`
  rounded-lg border transition-all duration-200
  ${expense.paid 
    ? "bg-paid/5 border-paid/20 hover:border-paid/30" 
    : "bg-pending/5 border-pending/20 hover:border-pending/30"
  }
`}>
```

### Botón de Estado
```tsx
<Button className={`
  ${expense.paid 
    ? "border-pending/30 text-pending hover:bg-pending/10" 
    : "bg-paid hover:bg-paid/90 text-paid-foreground"
  }
`}>
```

### Badge de Estado
```tsx
<Badge className={`
  ${expense.paid 
    ? "bg-paid/20 text-paid" 
    : "bg-pending/20 text-pending"
  }
`}>
```

### Formulario
```tsx
<Input className="border-primary/30 focus:border-primary focus:ring-primary" />
<SelectTrigger className="border-primary/30 focus:border-primary focus:ring-primary" />
```

## ⚡ Opacidades Rápidas

```tsx
bg-primary/10    // 10% - Muy suave
bg-primary/20    // 20% - Suave
bg-primary/30    // 30% - Medio
bg-primary/50    // 50% - Medio-fuerte
bg-primary/90    // 90% - Casi sólido
```

## 🔄 Estados de Hover

```tsx
hover:bg-primary/90     // Hover con 90% opacidad
hover:border-primary/30 // Hover en bordes
hover:text-primary      // Hover en texto
hover:bg-paid/20        // Hover en gastos pagados
hover:bg-pending/20     // Hover en gastos pendientes
```

## 🚫 ❌ No Hacer

```tsx
// ❌ Colores hardcodeados
bg-emerald-100 text-emerald-600
bg-amber-50 text-amber-800

// ❌ Mezclar sistemas
bg-primary text-emerald-600

// ❌ Colores sin propósito
bg-blue-500 text-white
```

## ✅ ✅ Hacer

```tsx
// ✅ Variables semánticas
bg-paid text-paid-foreground
bg-pending text-pending-foreground

// ✅ Consistencia
bg-primary hover:bg-primary/90
border-primary/30 focus:border-primary

// ✅ Propósito claro
bg-success text-success-foreground
bg-destructive text-destructive-foreground
```

## 🎨 Paleta Completa

### Modo Claro
- **Background**: Blanco puro
- **Foreground**: Negro suave
- **Primary**: Negro
- **Secondary**: Gris claro
- **Paid**: Verde
- **Pending**: Amarillo
- **Success**: Verde
- **Warning**: Amarillo
- **Destructive**: Rojo
- **Info**: Azul

### Modo Oscuro
- **Background**: Negro suave
- **Foreground**: Blanco
- **Primary**: Blanco
- **Secondary**: Gris oscuro
- **Paid**: Verde claro
- **Pending**: Amarillo claro
- **Success**: Verde claro
- **Warning**: Amarillo claro
- **Destructive**: Rojo oscuro
- **Info**: Azul claro

---

**💡 Tip**: Siempre usa variables semánticas en lugar de colores hardcodeados para mantener la consistencia y facilitar el mantenimiento.
