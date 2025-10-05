# 🔥 Configuración de Firebase - ControlGastos

Esta guía te ayudará a configurar Firebase para ControlGastos con integración completa de ControlFile.

## 📋 Prerrequisitos

- Cuenta de Google
- Node.js instalado
- Navegador web

## 🚀 Configuración paso a paso

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto (ej: "controlgastos-app")
4. Habilita Google Analytics (opcional)
5. Haz clic en "Crear proyecto"

### 2. Configurar Authentication

1. En el panel izquierdo, ve a **Authentication**
2. Haz clic en **Get started**
3. Ve a la pestaña **Sign-in method**
4. Habilita **Email/Password**:
   - Haz clic en "Email/Password"
   - Activa "Enable"
   - Guarda
5. Habilita **Google**:
   - Haz clic en "Google"
   - Activa "Enable"
   - Configura el email de soporte
   - Guarda

### 3. Configurar Firestore Database

1. En el panel izquierdo, ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona **Start in test mode** (para desarrollo)
4. Elige una ubicación (preferiblemente cercana a ti)
5. Haz clic en **Done**

### 4. Obtener credenciales de Firebase

1. Ve a **Project Settings** (ícono de engranaje)
2. En la pestaña **General**, baja hasta **Your apps**
3. Haz clic en el ícono **Web** (`</>`)
4. Registra tu app:
   - App nickname: "ControlGastos Web"
   - No marques "Also set up Firebase Hosting"
   - Haz clic en **Register app**
5. Copia la configuración que aparece

### 5. Configurar variables de entorno

1. En la raíz de tu proyecto, crea el archivo `.env.local`
2. Copia el contenido de `env.example` a `.env.local`
3. Reemplaza los valores con los de tu proyecto Firebase:

```env
# Firebase (Compartido entre ControlGastos y ControlFile)
NEXT_PUBLIC_CONTROLFILE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_CONTROLFILE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_CONTROLFILE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_CONTROLFILE_APP_ID=tu_app_id

# ControlFile Backend
NEXT_PUBLIC_CONTROLFILE_BACKEND_URL=https://controlfile.onrender.com
NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME=ControlFile
NEXT_PUBLIC_CONTROLFILE_APP_CODE=controlgastos
```

### 6. Configurar reglas de Firestore

1. Ve a **Firestore Database** > **Rules**
2. Usa el archivo `firestore.rules` del proyecto (ya está configurado)
3. Haz clic en **Publish**

**O usar el comando:**
```bash
npm run firebase:rules
```

## 🧪 Probar la configuración

1. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

2. Abre http://localhost:3000

3. Intenta registrarte con un email y contraseña

4. Verifica que puedas agregar gastos

5. Ve a `/profile` y conecta con ControlFile

## 🔧 Scripts útiles

```bash
# Configurar Firebase
npm run setup-firebase

# Ejecutar emuladores locales
npm run firebase:emulators

# Desplegar reglas de Firestore
npm run firebase:rules

# Desplegar a Firebase Hosting
npm run firebase:deploy
```

## 🏗️ Estructura de Datos

### Estructura Organizada (Nueva)
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

### Reglas de Seguridad
- **Separación por usuario** - Cada usuario solo accede a sus datos
- **Estructura organizada** - Datos separados por aplicación
- **Validación de auth** - Todas las operaciones requieren autenticación

## 🔒 Integración con ControlFile

### Firebase Auth Unificado
- **Un solo proyecto Firebase** para ControlGastos y ControlFile
- **Misma instancia de autenticación** - Sin popups molestos
- **Persistencia nativa** - Firebase maneja las sesiones automáticamente
- **Tokens compartidos** - ControlFile usa los tokens de ControlGastos

### Configuración Automática
- Al autenticarse en ControlGastos, automáticamente está conectado a ControlFile
- No requiere configuración adicional
- Conexión persistente hasta logout

## 🚨 Solución de problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo

### Error: "Permission denied"
- Verifica las reglas de Firestore
- Asegúrate de que el usuario esté autenticado
- Verifica que las reglas estén desplegadas: `npm run firebase:rules`

### Error: "ControlFile no conectado"
- Verifica que las variables de ControlFile estén configuradas
- Asegúrate de que el backend de ControlFile esté funcionando
- Verifica que el usuario esté autenticado en ControlGastos

### La aplicación no carga
- Verifica la consola del navegador para errores
- Asegúrate de que todas las variables de entorno estén configuradas
- Ejecuta `npm run type-check` para verificar errores de TypeScript

## 📚 Recursos adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Next.js + Firebase](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [ControlFile Backend](https://controlfile.onrender.com/docs)

## 🎉 ¡Listo!

Una vez completados estos pasos, ControlGastos estará completamente configurado con Firebase y ControlFile, listo para usar con todas las funcionalidades integradas.