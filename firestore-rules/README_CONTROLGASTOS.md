# 🔥 Firestore Rules - ControlGastos

## 📋 Arquitectura Modular

Este repositorio usa la arquitectura modular de reglas de Firestore compatible con ControlFile.

### Estructura de Archivos

```
gastos/
├── firestore-rules/                    # 📁 Carpeta de reglas modulares
│   ├── base.rules                      # ✅ Helpers compartidos (idéntico al de CONTROLFILE)
│   ├── controlgastos.rules             # ✅ Reglas específicas de CONTROLGASTOS
│   ├── build.js                        # ✅ Script que genera firestore.rules
│   ├── README.md                        # ✅ Documentación de arquitectura general
│   ├── README_CONTROLGASTOS.md         # ✅ Este archivo (guía específica)
│   └── ESTRUCTURA.md                   # ✅ Vista de estructura de archivos
│
├── firestore.rules                     # ⚠️ GENERADO (NO editar manualmente)
├── firebase.json                       # ✅ Configuración de Firebase
└── package.json                        # ✅ Script: "build:rules": "node firestore-rules/build.js"
```

---

## 🔄 Flujo de Trabajo

### ✅ Desarrollo Local

1. **Editar reglas modulares:**
   - Editar `firestore-rules/controlgastos.rules` (solo reglas de ControlGastos)
   - Editar `firestore-rules/base.rules` si necesitas helpers nuevos (luego sincronizar con CONTROLFILE)

2. **Generar firestore.rules para testing:**
   ```bash
   npm run build:rules
   ```
   Esto genera `firestore.rules` con solo las reglas de ControlGastos (para testing local).

3. **Probar localmente (opcional):**
   ```bash
   npm run firebase:emulators
   # Probar tus reglas en el emulador
   ```

### ⚠️ IMPORTANTE: Despliegue

**NO desplegar desde este repositorio.** El despliegue se hace desde CONTROLFILE.

**Flujo de despliegue:**

1. **En este repositorio (ControlGastos):**
   - Después de verificar que las reglas funcionan localmente
   - Asegurarse de que `firestore-rules/controlgastos.rules` está actualizado

2. **Copiar a CONTROLFILE:**
   - Copiar `firestore-rules/controlgastos.rules` a `CONTROLFILE/firestore-rules/controlgastos.rules`
   - Actualizar `CONTROLFILE/firestore-rules/build.js` para incluir `'controlgastos.rules'` en el array `files`

3. **Desplegar desde CONTROLFILE:**
   ```bash
   cd CONTROLFILE
   npm run build:rules              # Regenera firestore.rules con TODAS las apps
   firebase deploy --only firestore:rules  # Despliega al Firestore compartido
   ```

---

## 📝 Cambiar Reglas de ControlGastos

### Paso 1: Editar en este repositorio

Editar `firestore-rules/controlgastos.rules` con tus cambios.

### Paso 2: Probar localmente

```bash
npm run build:rules              # Regenera firestore.rules
npm run firebase:emulators       # (Opcional) Probar en emulador
```

### Paso 3: Copiar a CONTROLFILE y desplegar

1. Copiar `firestore-rules/controlgastos.rules` → `CONTROLFILE/firestore-rules/controlgastos.rules`
2. En CONTROLFILE:
   ```bash
   npm run build:rules
   firebase deploy --only firestore:rules
   ```

---

## 🎯 Reglas Actuales

### Estructura Organizada (Nueva)
- `apps/controlgastos/users/{userId}/expenses/{expenseId}` - Gastos
- `apps/controlgastos/users/{userId}/payments/{paymentId}` - Pagos
- `apps/controlgastos/users/{userId}/receipts/{receiptId}` - Comprobantes
- `apps/controlgastos/users/{userId}/recurring_items/{itemId}` - Items recurrentes
- `apps/controlgastos/users/{userId}/recurring_items_instances/{instanceId}` - Instancias
- `apps/controlgastos/users/{userId}/settings/{settingId}` - Configuraciones
- `apps/controlgastos/categories/{categoryId}` - Categorías globales

### Reglas Legacy (Compatibilidad)
- `expenses/{expenseId}` - Gastos (formato antiguo)
- `payments/{paymentId}` - Pagos (formato antiguo)
- `invoices/{invoiceId}` - Facturas (formato antiguo)

---

## 🔧 Helpers Disponibles (base.rules)

### Autenticación
- `isAuth()` - Verifica si el usuario está autenticado
- `uid()` - Retorna el UID del usuario autenticado

### Validación de Propiedad
- `ownerIs(field)` - Verifica que el campo `field` (ej: userId) pertenezca al usuario actual

### Operaciones
- `isCreate()` - Verifica si es una operación de creación
- `isUpdate()` - Verifica si es una operación de actualización

### Inmutabilidad
- `unchanged(field)` - Verifica que un campo no haya cambiado en update

### Validadores
- `strBetween(field, min, max)` - String entre min y max caracteres
- `nonEmptyString(field)` - String no vacío
- `isBool(field)` - Verifica si es booleano
- `isInt(field)` - Verifica si es entero
- `isTs(field)` - Verifica si es timestamp

### Lectura Pública
- `publicRead(flagField)` - Permite lectura pública si `flagField` es `true`

---

## ⚠️ Reglas de Oro

1. ✅ **NUNCA** editar `firestore.rules` manualmente (se regenera con `npm run build:rules`)
2. ✅ **SIEMPRE** mantener `base.rules` idéntico al de CONTROLFILE
3. ✅ **SOLO** CONTROLFILE despliega reglas al Firestore compartido
4. ✅ Todas las reglas modulares van en `firestore-rules/`
5. ✅ `firestore.rules` y `firebase.json` deben estar en la raíz

---

## 📚 Referencias

- Ver `README.md` para arquitectura completa
- Ver `ESTRUCTURA.md` para estructura de archivos
- Ver documentación en CONTROLFILE para flujo maestro

---

## 🆘 Troubleshooting

### Problema: Las reglas no se aplican

- Verifica que hayas ejecutado `npm run build:rules`
- Verifica que estés usando el proyecto Firebase correcto (el de ControlFile)
- Verifica que las reglas estén desplegadas desde CONTROLFILE

### Problema: Error al generar firestore.rules

- Verifica que `base.rules` existe
- Verifica que `controlgastos.rules` existe
- Verifica la sintaxis de las reglas

### Problema: No puedo acceder a mis datos

- Verifica que estés autenticado (`isAuth()`)
- Verifica que el `userId` coincida con tu UID (`userId == uid()`)
- Revisa las reglas específicas en `controlgastos.rules`

