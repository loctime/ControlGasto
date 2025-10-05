# 🚀 Guía de Desarrollo - ControlGastos

## 📋 Checklist Antes de Implementar Funcionalidades

### ✅ **Antes de Empezar**
- [ ] Ejecutar `npm run type-check` para verificar estado actual
- [ ] Leer `TYPESCRIPT_BEST_PRACTICES.md`
- [ ] Planificar todas las interfaces necesarias en `lib/types.ts`
- [ ] Revisar estructura de Firestore en `lib/firestore-paths.ts`

### ✅ **Durante el Desarrollo**
- [ ] Ejecutar `npm run type-check` después de cada cambio importante
- [ ] No usar `any`, siempre tipos específicos
- [ ] Importar tipos desde `@/lib/types` únicamente
- [ ] Validar props de componentes antes de usarlos
- [ ] Usar las rutas organizadas de Firestore

### ✅ **Antes de Commit**
- [ ] Ejecutar `npm run build` para verificar compilación
- [ ] Ejecutar `npm run type-check` para verificar tipos
- [ ] Revisar que no haya errores de linting
- [ ] Verificar que las reglas de Firestore estén actualizadas

## 🛠️ Comandos Útiles

```bash
# Verificación completa de tipos
npm run type-check

# Build completo
npm run build

# Desarrollo con validación automática
npm run dev

# Desplegar reglas de Firestore
npm run firebase:rules

# Configurar Firebase
npm run setup-firebase
```

## 🎯 Flujo de Trabajo Recomendado

1. **Planificar** → Definir interfaces en `types.ts` y rutas en `firestore-paths.ts`
2. **Implementar** → Usar `type-check` frecuentemente
3. **Validar** → `npm run build` antes de commit
4. **Commitear** → Solo si pasa todas las validaciones

## 🏗️ Arquitectura del Proyecto

### Estructura de Componentes
```
components/
├── ui/                    # Componentes base (shadcn/ui)
├── auth-provider.tsx      # Contexto de autenticación
├── controlfile-*.tsx      # Componentes de ControlFile
├── expenses-*.tsx         # Componentes de gastos
└── theme-*.tsx           # Componentes de tema
```

### Estructura de Servicios
```
lib/
├── firebase.ts           # Configuración de Firebase
├── controlfile.ts        # Servicio de ControlFile
├── auth.ts               # Funciones de autenticación
├── firestore-paths.ts    # Rutas organizadas de Firestore
├── types.ts              # Definiciones de tipos
└── utils.ts              # Utilidades generales
```

### Estructura de Datos
```
Firestore:
├── apps/controlgastos/users/{userId}/
│   ├── expenses/         # Gastos del usuario
│   ├── receipts/         # Comprobantes
│   └── settings/         # Configuraciones
└── users/{userId}/       # ControlFile (si necesario)
    ├── files/
    ├── folders/
    └── shares/
```

## 🔧 Integración con ControlFile

### Configuración
- **Firebase Auth unificado** - Mismo proyecto para ambas apps
- **Persistencia nativa** - Sin popups molestos
- **Tokens compartidos** - ControlFile usa tokens de ControlGastos

### Componentes Principales
- `ControlFileProvider` - Contexto global de conexión
- `ControlFileUpload` - Subida de archivos
- `ControlFileConnection` - Estado de conexión

### Servicios
- `controlFileService.uploadFile()` - Subir archivos
- `controlFileService.createFolder()` - Crear carpetas
- `controlFileService.createPermanentShare()` - Enlaces permanentes

## 🎨 Sistema de Colores

### Implementación
- **Colores semánticos** - `paid`, `pending`, `success`, `warning`
- **Modo oscuro automático** - Adaptación completa
- **Centralización** - Todos los colores en `tailwind.config.js`

### Documentación
- `COLORS_SYSTEM.md` - Sistema detallado
- `COLORS_QUICK_REFERENCE.md` - Referencia rápida
- `COLORS_EXAMPLES.md` - Ejemplos de uso

## 📚 Recursos

- `TYPESCRIPT_BEST_PRACTICES.md` - Mejores prácticas detalladas
- `FIREBASE_SETUP.md` - Configuración de Firebase
- `firestore.rules` - Reglas de seguridad
- `.vscode/settings.json` - Configuración del editor

## 🚨 Errores Comunes a Evitar

1. **No definir tipos completos desde el inicio**
2. **Usar `any` en lugar de tipos específicos**
3. **No validar durante el desarrollo**
4. **Crear interfaces duplicadas**
5. **No manejar props opcionales correctamente**
6. **Usar rutas hardcodeadas en lugar de `firestore-paths.ts`**
7. **No actualizar las reglas de Firestore al cambiar estructura**

## 💡 Tips

- Usar `npm run type-check` como "guardián" durante el desarrollo
- Configurar el editor con las mejores prácticas de TypeScript
- Mantener una sola fuente de verdad para tipos en `lib/types.ts`
- Documentar tipos complejos con comentarios
- Usar las rutas organizadas de Firestore para mantener consistencia
- Verificar reglas de Firestore antes de deployar cambios estructurales

## 🔒 Seguridad

### Firestore Rules
- **Separación por usuario** - Cada usuario solo accede a sus datos
- **Estructura organizada** - Datos separados por aplicación
- **Validación de auth** - Todas las operaciones requieren autenticación

### Variables de Entorno
- **Firebase config** - Credenciales compartidas
- **ControlFile config** - URLs y códigos de aplicación
- **No hardcodear** - Usar variables de entorno siempre

## 🚀 Deployment

### Vercel
1. Conectar repositorio
2. Configurar variables de entorno
3. Deploy automático

### Firebase
```bash
npm run build
npm run firebase:rules  # Desplegar reglas
firebase deploy
```

## 🧪 Testing

### Verificación de Tipos
```bash
npm run type-check  # Verificar TypeScript
```

### Build
```bash
npm run build  # Verificar compilación completa
```

### Linting
```bash
npm run lint  # Verificar código (si está configurado)
```