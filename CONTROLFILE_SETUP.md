# Configuración de ControlFile

## Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# ControlFile Integration
NEXT_PUBLIC_CONTROLFILE_BACKEND_URL=https://controlfile.onrender.com
NEXT_PUBLIC_CONTROLFILE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_CONTROLFILE_AUTH_DOMAIN=tu_auth_domain_aqui
NEXT_PUBLIC_CONTROLFILE_PROJECT_ID=tu_project_id_aqui
NEXT_PUBLIC_CONTROLFILE_APP_ID=tu_app_id_aqui
NEXT_PUBLIC_CONTROLFILE_APP_DISPLAY_NAME=ControlFile
```

## Funcionalidades Implementadas

### 1. Conexión con ControlFile
- **Ubicación**: Página de perfil (`/profile`)
- **Funcionalidad**: Permite conectar/desconectar la cuenta de ControlFile
- **Autenticación**: Google Auth a través de Firebase
- **Persistencia**: Sesión guardada localmente

### 2. Exportación de Datos
- **Ubicación**: Dashboard principal
- **Funcionalidad**: Botón "Exportar a ControlFile" en el header
- **Formato**: Archivo JSON con resumen de gastos
- **Carpeta**: Se crea automáticamente la carpeta "GastosApp" en ControlFile

### 3. Componentes Disponibles

#### ControlFileConnection
```tsx
import { ControlFileConnection } from "@/components/controlfile-connection"

<ControlFileConnection onConnectionChange={(connected) => console.log(connected)} />
```

#### ControlFileUpload
```tsx
import { ControlFileUpload } from "@/components/controlfile-upload"

<ControlFileUpload 
  file={file} 
  folderName="ControlGastos"
  onUploaded={(result) => console.log(result)}
/>
```

#### ControlFileUploadFromUrl
```tsx
import { ControlFileUploadFromUrl } from "@/components/controlfile-upload"

<ControlFileUploadFromUrl 
  fileUrl="https://example.com/file.pdf"
  fileName="documento.pdf"
  folderName="ControlGastos"
  onUploaded={(result) => console.log(result)}
/>
```

## Flujo de Uso

1. **Conectar**: El usuario va a `/profile` y hace clic en "Conectar con ControlFile"
2. **Autenticar**: Se abre popup de Google Auth (o redirect si está bloqueado)
3. **Exportar**: En el dashboard, el usuario puede hacer clic en "Exportar a ControlFile"
4. **Gestionar**: El usuario puede ir a ControlFile para ver los archivos exportados

## Backend de ControlFile

El sistema está configurado para usar el backend en `https://controlfile.onrender.com` con los siguientes endpoints:

- `GET /api/folders/root?name={folderName}` - Crear/obtener carpeta
- `POST /api/files/upload` - Subir archivo
- Autenticación: Bearer token de Firebase

## Notas Técnicas

- **Manejo de popups**: Si el navegador bloquea popups, automáticamente usa redirect
- **Persistencia**: Usa `browserLocalPersistence` para mantener la sesión
- **Error handling**: Manejo completo de errores con notificaciones toast
- **Rate limiting**: Implementado en el servicio para evitar spam
