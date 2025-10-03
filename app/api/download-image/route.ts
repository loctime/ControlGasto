import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL de imagen requerida' }, { status: 400 })
    }

    // Validar que la URL sea de BlackBlaze
    if (!imageUrl.includes('backblazeb2.com') && !imageUrl.includes('b2.')) {
      return NextResponse.json({ error: 'URL no válida' }, { status: 400 })
    }

    // Descargar la imagen desde BlackBlaze
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Error al descargar la imagen' }, { status: response.status })
    }

    // Obtener el contenido de la imagen
    const imageBuffer = await response.arrayBuffer()

    // Devolver la imagen con los headers apropiados
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="comprobante.jpg"',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Error en download-image API:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
