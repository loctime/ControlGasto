# 🚀 Plan de Migración - ControlFile API Actualizada

## 📋 Resumen de Cambios

Hemos actualizado el servicio de ControlFile para usar la API oficial según la documentación `API_REFERENCE.md`.

## 🔄 Cambios Principales

### 1. **Creación de Carpetas**
- **Antes**: `POST /api/folders` con estructura simple
- **Ahora**: 
  - `GET /api/folders/root?name=ControlGastos&pin=1` para carpeta principal
  - `POST /api/folders/create` para subcarpetas

### 2. **Subida de Archivos**
- **Antes**: `POST /api/files/upload` directo
- **Ahora**: Flujo de 3 pasos:
  1. `POST /api/uploads/presign` - Obtener URL temporal
  2. `PUT` al URL presignado - Subir archivo
  3. `POST /api/uploads/confirm` - Confirmar upload

### 3. **Nuevos Métodos**
- `createMainFolder()` - Crea carpeta principal en taskbar
- `createSubFolder()` - Crea subcarpetas
- `listFiles()` - Lista archivos en carpeta
- `healthCheck()` - Verifica estado del backend

## 🎯 Flujo Recomendado para ControlGastos

### 1. **Inicialización**
```typescript
// Crear carpeta principal al conectar por primera vez
const mainFolder = await controlFileService.createMainFolder("ControlGastos")
```

### 2. **Organización por Año**
```typescript
// Crear subcarpeta por año
const yearFolder = await controlFileService.createSubFolder(
  `Gastos ${new Date().getFullYear()}`,
  mainFolder.folderId
)
```

### 3. **Subir Comprobantes**
```typescript
// Subir archivo a la carpeta del año
const result = await controlFileService.uploadFile(
  file,
  yearFolder.folderId
)
```

## 📁 Estructura de Carpetas Propuesta

```
ControlGastos/ (carpeta principal en taskbar)
├── Gastos 2024/
│   ├── Comprobantes/
│   ├── Facturas/
│   └── Recibos/
├── Gastos 2025/
│   ├── Comprobantes/
│   ├── Facturas/
│   └── Recibos/
└── ...
```

## 🔧 Implementación

### Paso 1: Reemplazar el servicio actual
```bash
# Hacer backup del archivo actual
mv lib/controlfile.ts lib/controlfile-old.ts

# Usar la nueva versión
mv lib/controlfile-updated.ts lib/controlfile.ts
```

### Paso 2: Actualizar componentes
Los componentes que usan `controlFileService` necesitarán actualizarse para:
- Usar `createMainFolder()` en lugar de `createFolder()`
- Manejar el nuevo flujo de upload
- Organizar archivos en subcarpetas

### Paso 3: Migrar datos existentes
- Verificar carpetas existentes
- Crear nueva estructura organizada
- Migrar archivos si es necesario

## 🧪 Testing

### 1. **Health Check**
```typescript
const health = await controlFileService.healthCheck()
console.log('Backend status:', health.status)
```

### 2. **Crear Carpeta Principal**
```typescript
const folder = await controlFileService.createMainFolder("ControlGastos")
console.log('Carpeta creada:', folder.folderId)
```

### 3. **Subir Archivo de Prueba**
```typescript
const file = new File(['test'], 'test.txt', { type: 'text/plain' })
const result = await controlFileService.uploadFile(file, folder.folderId)
console.log('Archivo subido:', result.fileId)
```

## 🚨 Consideraciones Importantes

### 1. **Backward Compatibility**
- Los archivos existentes seguirán funcionando
- Las carpetas existentes se mantienen
- Solo nuevos uploads usarán el nuevo flujo

### 2. **Error Handling**
- Manejo robusto de errores en cada paso
- Fallback a métodos anteriores si es necesario
- Logging detallado para debugging

### 3. **Performance**
- Uploads más eficientes con presign
- Mejor manejo de archivos grandes
- Menos carga en el backend

## 📋 Checklist de Migración

- [ ] ✅ Crear nueva versión del servicio
- [ ] 🔄 Actualizar componentes que usan ControlFile
- [ ] 🧪 Probar health check
- [ ] 🧪 Probar creación de carpetas
- [ ] 🧪 Probar upload de archivos
- [ ] 🧪 Probar enlaces de compartir
- [ ] 📚 Actualizar documentación
- [ ] 🚀 Deploy y monitoreo

## 🎯 Beneficios de la Migración

1. **API Oficial** - Usando endpoints documentados
2. **Mejor Organización** - Carpetas en taskbar + subcarpetas
3. **Uploads Eficientes** - Flujo presign optimizado
4. **Más Funcionalidades** - Listado, health check, etc.
5. **Mejor Manejo de Errores** - Respuestas estructuradas
6. **Escalabilidad** - Preparado para archivos grandes

## 🔮 Próximos Pasos

1. **Implementar la migración** paso a paso
2. **Probar en desarrollo** con datos reales
3. **Actualizar componentes** para usar nueva estructura
4. **Deploy gradual** con monitoreo
5. **Migrar usuarios existentes** sin interrupciones


