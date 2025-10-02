# 🎨 Sistema de Colores - App de Gastos

## 📋 Índice
- [Visión General](#visión-general)
- [Estructura del Sistema](#estructura-del-sistema)
- [Colores Base](#colores-base)
- [Colores Semánticos](#colores-semánticos)
- [Colores por Categoría](#colores-por-categoría)
- [Modo Claro vs Oscuro](#modo-claro-vs-oscuro)
- [Uso en Componentes](#uso-en-componentes)
- [Mejores Prácticas](#mejores-prácticas)
- [Troubleshooting](#troubleshooting)

## 🎯 Visión General

Este sistema de colores está diseñado para proporcionar una experiencia visual consistente y accesible en toda la aplicación de gastos. Utiliza **CSS Custom Properties** con formato **OKLCH** para mejor consistencia perceptual y soporte completo para modo claro y oscuro.

### Características Principales
- ✅ **Centralizado**: Todos los colores definidos en `app/globals.css`
- ✅ **Semántico**: Nombres descriptivos por función
- ✅ **Accesible**: Contraste optimizado para ambos modos
- ✅ **Escalable**: Fácil agregar nuevos colores
- ✅ **Consistente**: Mismo sistema en todos los componentes

## 🏗️ Estructura del Sistema

### Archivos Principales
```
├── app/globals.css          # Variables CSS principales
├── tailwind.config.js       # Configuración de Tailwind
└── COLORS_SYSTEM.md         # Esta documentación
```

### Flujo de Colores
```
CSS Variables (globals.css) → Tailwind Config → Componentes
```

## 🎨 Colores Base

### Colores Principales
| Variable | Modo Claro | Modo Oscuro | Uso |
|----------|------------|-------------|-----|
| `--background` | Blanco puro | Negro suave | Fondo principal |
| `--foreground` | Negro suave | Blanco | Texto principal |
| `--primary` | Negro | Blanco | Botones principales |
| `--secondary` | Gris claro | Gris oscuro | Elementos secundarios |
| `--muted` | Gris muy claro | Gris medio | Elementos deshabilitados |
| `--accent` | Gris claro | Gris oscuro | Acentos sutiles |

### Colores de Estado
| Variable | Modo Claro | Modo Oscuro | Uso |
|----------|------------|-------------|-----|
| `--destructive` | Rojo | Rojo oscuro | Errores, eliminar |
| `--success` | Verde | Verde claro | Éxito, confirmación |
| `--warning` | Amarillo | Amarillo claro | Advertencias |
| `--info` | Azul | Azul claro | Información |

### Colores de Interfaz
| Variable | Uso |
|----------|-----|
| `--border` | Bordes de elementos |
| `--input` | Campos de entrada |
| `--ring` | Focus rings |
| `--card` | Fondos de tarjetas |
| `--popover` | Fondos de popovers |

## 🏷️ Colores Semánticos

### Estados de Gastos
```css
/* Gastos Pagados */
--paid: oklch(0.646 0.222 141.116);        /* Verde */
--paid-foreground: oklch(0.985 0 0);       /* Blanco */

/* Gastos Pendientes */
--pending: oklch(0.828 0.189 84.429);      /* Amarillo */
--pending-foreground: oklch(0.145 0 0);    /* Negro */
```

### Uso en Tailwind
```tsx
// ✅ Correcto - Usar variables semánticas
<div className="bg-paid/10 text-paid">Pagado</div>
<div className="bg-pending/10 text-pending">Pendiente</div>

// ❌ Incorrecto - Colores hardcodeados
<div className="bg-emerald-100 text-emerald-600">Pagado</div>
```

## 🏠 Colores por Categoría

### Categorías de Gastos
| Categoría | Color | Uso |
|-----------|-------|-----|
| `category-hogar` | Azul | 🏠 Hogar |
| `category-transporte` | Naranja | 🚗 Transporte |
| `category-alimentacion` | Amarillo | 🍽️ Alimentación |
| `category-servicios` | Púrpura | ⚡ Servicios |
| `category-entretenimiento` | Rosa | 🎬 Entretenimiento |
| `category-salud` | Rojo | 🏥 Salud |
| `category-otros` | Gris | 📦 Otros |

### Implementación
```tsx
// En componentes
<Badge className="bg-category-hogar/20 text-category-hogar">
  🏠 Hogar
</Badge>
```

## 🌓 Modo Claro vs Oscuro

### Automático
Los colores se adaptan automáticamente según la clase `.dark` en el HTML:

```css
:root {
  --background: oklch(1 0 0);        /* Blanco */
  --foreground: oklch(0.145 0 0);    /* Negro */
}

.dark {
  --background: oklch(0.145 0 0);     /* Negro */
  --foreground: oklch(0.985 0 0);    /* Blanco */
}
```

### Forzar Modo
```tsx
// Forzar modo oscuro
<div className="dark">
  <Componente />
</div>

// Forzar modo claro
<div className="light">
  <Componente />
</div>
```

## 🧩 Uso en Componentes

### Ejemplos Prácticos

#### 1. Tarjetas de Gastos
```tsx
// ✅ Correcto
<div className={`
  rounded-lg border transition-all duration-200
  ${expense.paid 
    ? "bg-paid/5 border-paid/20 hover:border-paid/30" 
    : "bg-pending/5 border-pending/20 hover:border-pending/30"
  }
`}>
```

#### 2. Botones de Estado
```tsx
// ✅ Correcto
<Button className={`
  ${expense.paid 
    ? "border-pending/30 text-pending hover:bg-pending/10" 
    : "bg-paid hover:bg-paid/90 text-paid-foreground"
  }
`}>
```

#### 3. Badges de Estado
```tsx
// ✅ Correcto
<Badge className={`
  ${expense.paid 
    ? "bg-paid/20 text-paid" 
    : "bg-pending/20 text-pending"
  }
`}>
```

### Clases de Utilidad Comunes

#### Opacidades
```tsx
bg-primary/10    // 10% opacidad
bg-primary/20    // 20% opacidad
bg-primary/30    // 30% opacidad
bg-primary/50    // 50% opacidad
bg-primary/90    // 90% opacidad
```

#### Estados de Hover
```tsx
hover:bg-primary/90     // Hover con 90% opacidad
hover:border-primary/30 // Hover en bordes
hover:text-primary      // Hover en texto
```

## 📏 Mejores Prácticas

### ✅ Hacer
```tsx
// Usar variables semánticas
<div className="bg-paid text-paid-foreground">

// Usar opacidades para fondos sutiles
<div className="bg-primary/10 border-primary/20">

// Mantener consistencia en estados
<Button className="bg-primary hover:bg-primary/90">
```

### ❌ No Hacer
```tsx
// No usar colores hardcodeados
<div className="bg-emerald-100 text-emerald-600">

// No mezclar sistemas de colores
<div className="bg-primary text-emerald-600">

// No usar colores sin propósito semántico
<div className="bg-blue-500 text-white">
```

### 🎯 Reglas de Naming

#### Colores Base
- `primary` - Color principal de la marca
- `secondary` - Color secundario
- `muted` - Elementos deshabilitados
- `accent` - Acentos sutiles

#### Colores de Estado
- `success` - Éxito, confirmación
- `warning` - Advertencias
- `error` / `destructive` - Errores
- `info` - Información

#### Colores Específicos
- `paid` - Gastos pagados
- `pending` - Gastos pendientes
- `category-*` - Por categoría

## 🔧 Troubleshooting

### Problema: Los colores no cambian
**Solución**: Verificar que `tailwind.config.js` esté configurado correctamente

### Problema: Modo oscuro no funciona
**Solución**: Verificar que la clase `.dark` esté aplicada al elemento correcto

### Problema: Colores inconsistentes
**Solución**: Asegurar que todos los componentes usen variables CSS, no colores hardcodeados

### Problema: Contraste insuficiente
**Solución**: Revisar los valores OKLCH en `globals.css` y ajustar según sea necesario

## 🚀 Agregar Nuevos Colores

### 1. Definir en CSS
```css
/* En app/globals.css */
:root {
  --nuevo-color: oklch(0.5 0.1 200);
  --nuevo-color-foreground: oklch(0.9 0 0);
}

.dark {
  --nuevo-color: oklch(0.7 0.1 200);
  --nuevo-color-foreground: oklch(0.1 0 0);
}
```

### 2. Agregar a Tailwind
```js
// En tailwind.config.js
colors: {
  nuevoColor: {
    DEFAULT: "hsl(var(--nuevo-color))",
    foreground: "hsl(var(--nuevo-color-foreground))",
  }
}
```

### 3. Usar en Componentes
```tsx
<div className="bg-nuevo-color text-nuevo-color-foreground">
  Nuevo elemento
</div>
```

## 📚 Referencias

- [OKLCH Color Format](https://oklch.com/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Última actualización**: Diciembre 2024  
**Mantenido por**: Equipo de Desarrollo  
**Versión**: 1.0.0
