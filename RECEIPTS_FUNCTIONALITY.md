# Funcionalidad de Comprobantes de Pago

## Descripción
Esta funcionalidad permite a los usuarios subir comprobantes de pago cuando marcan un gasto como "pagado", integrando con ControlFile para el almacenamiento seguro de las imágenes.

## Flujo de Funcionamiento

### 1. Marcado como Pagado
- Cuando el usuario hace clic en "Pagar" en un gasto pendiente
- Se abre un diálogo preguntando si desea subir un comprobante de pago
- Si no hay cuenta conectada con ControlFile, se solicita la conexión

### 2. Subida de Comprobante
- **Opción 1: Tomar foto** - Usa la cámara del dispositivo
- **Opción 2: Galería** - Selecciona imagen existente
- La imagen se sube automáticamente a ControlFile en la carpeta "Comprobantes de Pago - [Año]"
- Se guarda el ID de la imagen en la base de datos

### 3. Visualización de Comprobantes
- Los gastos pagados con comprobante muestran un badge "Comprobante"
- Botón "Ver Comprobante" para acceder a la imagen
- Resumen de comprobantes en el dashboard

## Componentes Implementados

### `PaymentReceiptDialog`
- Diálogo principal para subir comprobantes
- Integración con ControlFile
- Opciones de cámara y galería
- Manejo de estados de carga

### `ReceiptViewer`
- Visualizador de comprobantes guardados
- Enlace directo a ControlFile
- Información del gasto asociado

### `ReceiptsSummary`
- Resumen estadístico de comprobantes
- Métricas de cobertura
- Totales con y sin comprobante

## Base de Datos

### Campo Agregado
```typescript
interface Expense {
  // ... campos existentes
  receiptImageId?: string  // ID de la imagen en ControlFile
}
```

### Lógica de Almacenamiento
- Al marcar como pagado: se guarda `receiptImageId` si se subió imagen
- Al marcar como pendiente: se limpia `receiptImageId`

## Integración con ControlFile

### Requisitos
- Usuario debe estar conectado con ControlFile
- Configuración de variables de entorno para ControlFile
- Autenticación con Google OAuth

### Funcionalidades
- Subida automática de imágenes
- Organización en carpetas por año
- Acceso directo desde la aplicación
- Gestión de permisos y autenticación

## Estados de la UI

### Gastos Pendientes
- Botón "Pagar" que abre diálogo de comprobante
- Sin indicadores de comprobante

### Gastos Pagados
- Badge "Pagado" + "Comprobante" (si tiene)
- Botón "Ver Comprobante" (si tiene)
- Botón "Pendiente" para revertir

### Sin Conexión ControlFile
- Solicitud de conexión automática
- Mensaje informativo sobre la necesidad de conexión
- Botón para conectar directamente

## Beneficios

1. **Trazabilidad Completa**: Cada pago puede tener su comprobante
2. **Almacenamiento Seguro**: Imágenes guardadas en ControlFile
3. **Acceso Fácil**: Visualización directa desde la app
4. **Organización**: Comprobantes organizados por año
5. **Estadísticas**: Resumen de cobertura de comprobantes

## Consideraciones Técnicas

- **Responsive**: Funciona en móvil y desktop
- **Optimización**: Subida asíncrona sin bloquear UI
- **Error Handling**: Manejo de errores de conexión y subida
- **Performance**: Lazy loading de imágenes
- **Seguridad**: Autenticación requerida para ControlFile
