# 💰 ControlGasto - Gestor de Gastos Fijos

Una aplicación web moderna y elegante para gestionar tus gastos fijos mensuales. Desarrollada con Next.js 14, TypeScript, Firebase y Tailwind CSS.

![ControlGasto](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-10.0-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Características

- 🔐 **Autenticación segura** con Firebase (Google + Email)
- 💳 **Gestión de gastos fijos** con estado de pago
- 📊 **Dashboard intuitivo** con resúmenes visuales
- 📱 **PWA (Progressive Web App)** - Instalable en móvil
- 🌙 **Modo oscuro** automático
- 📈 **Historial con gráficos** interactivos
- 🔄 **Sincronización en tiempo real** con Firestore
- 📱 **Diseño responsive** para móvil y desktop

## 🚀 Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📦 Instalación

1. **Clona el repositorio**
```bash
git clone https://github.com/loctime/ControlGasto.git
cd ControlGasto
```

2. **Instala las dependencias**
```bash
npm install
# o
pnpm install
```

3. **Configura Firebase**
   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Authentication (Email/Password + Google)
   - Crea una base de datos Firestore
   - Copia las credenciales a `.env.local`

4. **Ejecuta en desarrollo**
```bash
npm run dev
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

### Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting
npm run setup-firebase # Configurar Firebase
```

## 📱 Uso

1. **Regístrate** con Google o email
2. **Agrega gastos fijos** (renta, internet, etc.)
3. **Marca como pagado** cuando los pagues
4. **Visualiza resúmenes** en el dashboard
5. **Revisa historial** con gráficos

## 🎨 Características del diseño

- **Header elegante** con resúmenes visuales
- **Lista de gastos moderna** con hover effects
- **Formularios contextuales** con colores semánticos
- **Estados vacíos atractivos** con call-to-action
- **Transiciones suaves** y micro-interacciones

## 🔒 Seguridad

- **Reglas de Firestore** configuradas para proteger datos
- **Autenticación robusta** con Firebase
- **Validación de datos** en frontend y backend
- **Variables de entorno** para credenciales

## 📊 Estructura del proyecto

```
ControlGasto/
├── app/                    # App Router de Next.js
│   ├── dashboard/          # Página principal
│   ├── history/           # Historial y gráficos
│   └── profile/           # Perfil de usuario
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI base
│   ├── expenses-*.tsx    # Componentes de gastos
│   └── auth-provider.tsx # Contexto de autenticación
├── lib/                  # Utilidades y configuración
│   ├── firebase.ts       # Configuración de Firebase
│   └── auth.ts           # Funciones de autenticación
└── public/               # Archivos estáticos
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

---

⭐ **¡Si te gusta este proyecto, dale una estrella!** ⭐