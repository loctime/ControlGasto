# 💰 ControlGastos - Gestor de Gastos Fijos

Una aplicación web moderna y elegante para gestionar tus gastos fijos mensuales. Desarrollada con Next.js 14, TypeScript, Firebase y Tailwind CSS, integrada con ControlFile para gestión de documentos.

![ControlGastos](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-10.0-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Características

### 💳 Gestión de Gastos
- 🔐 **Autenticación segura** con Firebase (Google + Email)
- 💳 **Gestión de gastos fijos** con estado de pago
- 📊 **Dashboard intuitivo** con resúmenes visuales
- 📈 **Historial con gráficos** interactivos
- 🔄 **Sincronización en tiempo real** con Firestore

### 📁 Integración con ControlFile
- 📤 **Subida de archivos** - Comprobantes, facturas y documentos
- 📁 **Organización automática** - Carpetas por usuario y tipo
- 🔗 **Enlaces de compartir** - Enlaces permanentes para documentos
- 🚀 **Conexión persistente** - Mismo Firebase Auth, sin popups
- 📱 **UI integrada** - Botones y componentes nativos

### 📱 Experiencia de Usuario
- 📱 **PWA (Progressive Web App)** - Instalable en móvil
- 🌙 **Modo oscuro** automático
- 📱 **Diseño responsive** para móvil y desktop
- 🎨 **Sistema de colores centralizado** con soporte completo para modo claro/oscuro

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Auth + Firestore)
- **Archivos**: ControlFile (gestión de documentos)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📦 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/loctime/ControlGasto.git
cd ControlGasto
```

### 2. Instalar dependencias
```bash
npm install
# o
pnpm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` con:

```env
# Firebase (Compartido entre ControlGastos y ControlFile)
NEXT_PUBLIC_CONTROLFILE_API_KEY=tu_api_key
NEXT_PUBLIC_CONTROLFILE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_CONTROLFILE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_CONTROLFILE_APP_ID=tu_app_id

# ControlFile Backend
NEXT_PUBLIC_CONTROLFILE_BACKEND_URL=https://controlfile.onrender.com
NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME=ControlFile
NEXT_PUBLIC_CONTROLFILE_APP_CODE=controlgastos
```

### 4. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Authentication (Email/Password + Google)
3. Crea una base de datos Firestore
4. Despliega las reglas de seguridad:
   ```bash
   npm run firebase:rules
   ```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

## 🔧 Scripts Disponibles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linting
npm run type-check       # Verificación de tipos TypeScript
npm run setup-firebase   # Configurar Firebase
npm run firebase:rules   # Desplegar reglas de Firestore
```

## 📱 Uso

### Gestión de Gastos
1. **Regístrate** con Google o email
2. **Agrega gastos fijos** (renta, internet, etc.)
3. **Marca como pagado** cuando los pagues
4. **Visualiza resúmenes** en el dashboard
5. **Revisa historial** con gráficos

### Gestión de Documentos
1. **Conexión automática** - Al autenticarte en ControlGastos, automáticamente estás conectado a ControlFile
2. **Sube comprobantes** - Adjunta facturas y documentos a tus gastos
3. **Organización automática** - Los archivos se organizan en carpetas por usuario
4. **Comparte documentos** - Genera enlaces permanentes para compartir
5. **Acceso directo** - Botón para ir a ControlFile con autenticación automática

## 🎨 Sistema de Colores

La aplicación utiliza un sistema de colores semántico y centralizado:

- **Colores base**: `primary`, `secondary`, `muted`, `accent`
- **Estados de gastos**: `paid` (verde), `pending` (amarillo)
- **Colores de estado**: `success`, `warning`, `destructive`, `info`
- **Categorías**: Colores específicos por tipo de gasto
- **Modo oscuro**: Adaptación automática de todos los colores

**Documentación completa**: Ver `COLORS_SYSTEM.md` para detalles técnicos.

## 🏗️ Arquitectura

### Estructura del Proyecto
```
ControlGastos/
├── app/                          # App Router de Next.js
│   ├── dashboard/               # Página principal
│   ├── history/                # Historial y gráficos
│   ├── profile/                # Perfil de usuario
│   └── api/                    # API routes
├── components/                  # Componentes reutilizables
│   ├── ui/                     # Componentes de UI base (shadcn/ui)
│   ├── expenses-*.tsx          # Componentes de gastos
│   ├── controlfile-*.tsx       # Componentes de ControlFile
│   └── auth-provider.tsx       # Contexto de autenticación
├── lib/                        # Utilidades y configuración
│   ├── firebase.ts             # Configuración de Firebase
│   ├── controlfile.ts          # Servicio de ControlFile
│   ├── auth.ts                 # Funciones de autenticación
│   └── firestore-paths.ts      # Rutas de Firestore organizadas
├── hooks/                      # Custom hooks
├── public/                     # Archivos estáticos
└── docs/                       # Documentación
```

### Estructura de Datos en Firestore
```
Firestore:
├── apps/controlgastos/users/{userId}/
│   ├── expenses/               # Gastos del usuario
│   ├── receipts/              # Comprobantes
│   └── settings/              # Configuraciones
└── users/{userId}/            # ControlFile (si necesario)
    ├── files/
    ├── folders/
    └── shares/
```

### Firebase Auth Unificado
- **Un solo proyecto Firebase** para ControlGastos y ControlFile
- **Misma instancia de autenticación** - Sin popups molestos
- **Persistencia nativa** - Firebase maneja las sesiones automáticamente
- **Tokens compartidos** - ControlFile usa los tokens de ControlGastos

## 🔒 Seguridad

- **Reglas de Firestore** configuradas para proteger datos por usuario
- **Autenticación robusta** con Firebase
- **Validación de datos** en frontend y backend
- **Variables de entorno** para credenciales
- **Estructura organizada** de datos con separación por aplicación

## 📱 Componentes de ControlFile

### ControlFileProvider
Contexto global que maneja el estado de conexión:

```tsx
import { ControlFileProvider } from "@/components/controlfile-provider"

<ControlFileProvider>
  <YourApp />
</ControlFileProvider>
```

### ControlFileUpload
Componente para subir archivos:

```tsx
import { ControlFileUpload } from "@/components/controlfile-upload"

<ControlFileUpload 
  file={file}
  folderName="ControlGastos/Comprobantes"
  onUploaded={(result) => console.log(result)}
/>
```

### ControlFileUploadFromUrl
Subir archivos desde URL:

```tsx
import { ControlFileUploadFromUrl } from "@/components/controlfile-upload"

<ControlFileUploadFromUrl 
  fileUrl="https://example.com/factura.pdf"
  fileName="factura-enero.pdf"
  folderName="ControlGastos/Facturas"
/>
```

## 🚀 Deployment

### Vercel (Recomendado)
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🔧 Desarrollo

### Verificación de Tipos
```bash
npm run type-check  # Verificar TypeScript
npm run lint        # Verificar linting
npm run build       # Build completo
```

### Estructura de Archivos de Documentación
- `COLORS_SYSTEM.md` - Sistema de colores detallado
- `COLORS_QUICK_REFERENCE.md` - Referencia rápida de colores
- `COLORS_EXAMPLES.md` - Ejemplos de implementación
- `DEVELOPMENT_GUIDE.md` - Guía de desarrollo
- `TYPESCRIPT_BEST_PRACTICES.md` - Mejores prácticas de TypeScript

## 🚨 Solución de Problemas

### Error: "Usuario no autenticado"
- Verificar que el usuario esté logueado en ControlGastos
- El Firebase Auth debe estar funcionando

### Error de permisos en Firestore
- Verificar que las reglas de Firestore estén desplegadas
- Verificar que el usuario tenga los claims correctos

### Error de build
```bash
npm run type-check  # Verificar errores de TypeScript
npm run build       # Verificar build completo
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

**loctime** - [@loctime](https://github.com/loctime)

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) por el framework
- [Firebase](https://firebase.google.com/) por el backend
- [Tailwind CSS](https://tailwindcss.com/) por el styling
- [shadcn/ui](https://ui.shadcn.com/) por los componentes
- [ControlFile](https://controlfile.onrender.com/) por la gestión de archivos

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐