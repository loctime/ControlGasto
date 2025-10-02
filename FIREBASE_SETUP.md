# 🔥 Configuración de Firebase para GastosApp

Esta guía te ayudará a configurar Firebase para tu aplicación de gastos.

## 📋 Prerrequisitos

- Cuenta de Google
- Node.js instalado
- Navegador web

## 🚀 Configuración paso a paso

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto (ej: "gastos-app")
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
   - App nickname: "GastosApp Web"
   - No marques "Also set up Firebase Hosting"
   - Haz clic en **Register app**
5. Copia la configuración que aparece

### 5. Configurar variables de entorno

1. En la raíz de tu proyecto, crea el archivo `.env.local`
2. Copia el contenido de `env.example` a `.env.local`
3. Reemplaza los valores con los de tu proyecto Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### 6. Configurar reglas de Firestore

1. Ve a **Firestore Database** > **Rules**
2. Reemplaza las reglas existentes con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Haz clic en **Publish**

## 🧪 Probar la configuración

1. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

2. Abre http://localhost:3000 (o el puerto que se muestre)

3. Intenta registrarte con un email y contraseña

4. Verifica que puedas agregar gastos

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

## 🚨 Solución de problemas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo

### Error: "Permission denied"
- Verifica las reglas de Firestore
- Asegúrate de que el usuario esté autenticado

### La aplicación no carga
- Verifica la consola del navegador para errores
- Asegúrate de que todas las variables de entorno estén configuradas

## 📚 Recursos adicionales

- [Documentación de Firebase](https://firebase.google.com/docs)
- [Next.js + Firebase](https://firebase.google.com/docs/web/setup)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación GastosApp estará completamente configurada con Firebase y lista para usar.
