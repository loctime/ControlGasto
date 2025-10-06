import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const fileSize = formData.get('fileSize') as string
    const mimeType = formData.get('mimeType') as string
    const parentId = formData.get('parentId') as string
    const authToken = formData.get('authToken') as string

    if (!file || !fileName || !fileSize || !mimeType || !parentId || !authToken) {
      return NextResponse.json({ error: 'Parámetros requeridos faltantes' }, { status: 400 })
    }

    try {
      // Paso 1: Obtener URL de presign desde el backend de ControlFile
      const presignResponse = await fetch(`${process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL}/api/uploads/presign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: fileName,
          size: parseInt(fileSize),
          mime: mimeType,
          parentId: parentId
        })
      })

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Error presign HTTP: ${presignResponse.status}`)
      }

      const presignData = await presignResponse.json()

      // Paso 2: Subir archivo al URL presignado desde el servidor (evita CORS)
      const uploadResponse = await fetch(presignData.url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': mimeType
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`Error subiendo archivo: ${uploadResponse.status}`)
      }

      const etag = uploadResponse.headers.get('etag')

      // Paso 3: Confirmar upload
      const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL}/api/uploads/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          uploadSessionId: presignData.uploadSessionId,
          etag: etag
        })
      })

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Error confirmando upload: ${confirmResponse.status}`)
      }

      const confirmData = await confirmResponse.json()

      // Paso 4: Obtener URL del archivo
      const fileUrlResponse = await fetch(`${process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL}/api/files/presign-get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fileId: confirmData.fileId
        })
      })

      let fileUrl = ''
      if (fileUrlResponse.ok) {
        const fileUrlData = await fileUrlResponse.json()
        fileUrl = fileUrlData.downloadUrl
      }

      return NextResponse.json({
        success: true,
        fileId: confirmData.fileId,
        fileUrl: fileUrl,
        fileName: fileName,
        fileSize: parseInt(fileSize)
      })

    } catch (error: any) {
      console.error('Error en upload-file API:', error)
      return NextResponse.json(
        { error: error.message || 'Error subiendo archivo' }, 
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en upload-file API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
