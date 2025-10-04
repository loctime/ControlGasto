# 🛡️ Mejores Prácticas TypeScript - ControlGasto

## 🎯 Objetivo
Evitar errores de compilación después de implementar funcionalidades nuevas.

## 📋 Checklist Antes de Implementar

### 1. **Planificar Tipos Primero**
- [ ] Definir TODAS las interfaces necesarias en `lib/types.ts`
- [ ] Incluir TODAS las propiedades que se van a usar
- [ ] Usar tipos específicos, evitar `any`
- [ ] Documentar qué representa cada propiedad

### 2. **Validar Durante Desarrollo**
- [ ] Ejecutar `npm run build` después de cada cambio importante
- [ ] No esperar al final para validar tipos
- [ ] Revisar errores de linting inmediatamente

### 3. **Mantener Consistencia**
- [ ] Usar las mismas interfaces en todos los archivos
- [ ] No crear versiones locales de interfaces
- [ ] Importar tipos desde `@/lib/types` siempre

## 🔧 Patrones Comunes y Soluciones

### **Interfaces de Datos**
```typescript
// ✅ CORRECTO: Definir completo desde el inicio
export interface Payment {
  id: string
  userId: string
  expenseId: string
  expenseName: string
  amount: number
  currency: string
  paidAt: Date
  receiptImageId?: string
  notes?: string
  createdAt: Date
  type?: PaymentType // Definir si se va a usar
  status?: ExpenseStatus // Definir si se va a usar
}

// ❌ INCORRECTO: Agregar propiedades después
export interface Payment {
  id: string
  amount: number
  // ... luego agregar más propiedades cuando hay error
}
```

### **Record Types Completos**
```typescript
// ✅ CORRECTO: Incluir TODAS las propiedades del tipo
export type PaymentType = 
  | 'rent'
  | 'utilities' 
  | 'maintenance'
  | 'insurance'
  | 'taxes'
  | 'credit_card'
  | 'cash'
  | 'transfer'
  | 'other'

const labels: Record<PaymentType, string> = {
  rent: 'Alquiler',
  utilities: 'Servicios',
  maintenance: 'Mantenimiento',
  insurance: 'Seguros',
  taxes: 'Impuestos',
  credit_card: 'Tarjeta de Crédito',
  cash: 'Efectivo',
  transfer: 'Transferencia',
  other: 'Otros'
  // ✅ TODAS las propiedades incluidas
}
```

### **Manejo de Props Opcionales**
```typescript
// ✅ CORRECTO: Manejar undefined explícitamente
{payment.type && (
  <Badge className={getPaymentTypeColor(payment.type)}>
    {getPaymentTypeLabel(payment.type)}
  </Badge>
)}

// ✅ CORRECTO: Usar valores por defecto
paymentType={payment.type || 'other'}
```

### **Event Handlers con Tipos Correctos**
```typescript
// ✅ CORRECTO: Convertir tipos cuando es necesario
<Checkbox 
  checked={isSelected}
  onCheckedChange={(checked) => setIsSelected(checked === true)}
/>

// ❌ INCORRECTO: Usar directamente
<Checkbox 
  checked={isSelected}
  onCheckedChange={setIsSelected} // Error de tipo
/>
```

## 🚨 Errores Comunes a Evitar

### 1. **Propiedades Inexistentes**
- **Problema**: `payment.month` cuando la interfaz no tiene `month`
- **Solución**: Usar propiedades existentes o agregarlas a la interfaz

### 2. **Record Types Incompletos**
- **Problema**: `Record<PaymentType, string>` sin todas las propiedades
- **Solución**: Incluir TODAS las propiedades del tipo

### 3. **Tipos de Event Handlers**
- **Problema**: `onCheckedChange` espera `CheckedState` pero recibe `Dispatch`
- **Solución**: Convertir tipos explícitamente

### 4. **Interfaces Inconsistentes**
- **Problema**: Misma interfaz con propiedades diferentes en archivos diferentes
- **Solución**: Una sola definición en `types.ts`

## 📝 Proceso Recomendado

1. **Antes de implementar**:
   - Definir interfaces completas en `types.ts`
   - Validar que cubran todos los casos de uso

2. **Durante implementación**:
   - Ejecutar `npm run build` frecuentemente
   - Revisar errores de linting inmediatamente

3. **Después de implementar**:
   - Verificar que el build sea exitoso
   - Documentar cualquier tipo nuevo agregado

## 🔍 Comandos Útiles

```bash
# Validar tipos
npm run build

# Ver errores de linting específicos
npm run lint

# Verificar tipos en archivo específico
npx tsc --noEmit components/archivo.tsx
```

## 💡 Tips Adicionales

- **Usar TypeScript estricto**: Configurar `strict: true` en `tsconfig.json`
- **Evitar `any`**: Siempre usar tipos específicos
- **Documentar tipos complejos**: Agregar comentarios explicativos
- **Reutilizar tipos**: No duplicar definiciones similares
- **Validar props**: Asegurar que todos los props tengan tipos correctos

