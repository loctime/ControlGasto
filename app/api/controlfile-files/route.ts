import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const backendUrl = process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com"

    let endpoint = ''
    let requestBody = data

    switch (action) {
      case 'presign-get':
        endpoint = '/api/files/presign-get'
        break
      case 'list':
        endpoint = '/api/files/list'
        break
      case 'create-share':
        endpoint = '/api/shares/create'
        break
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.error || `Error HTTP: ${response.status}` 
      }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error en proxy de archivos:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const pageSize = searchParams.get('pageSize')

    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autorización requerido' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const backendUrl = process.env.NEXT_PUBLIC_CONTROLFILE_BACKEND_URL || "https://controlfile.onrender.com"

    const params = new URLSearchParams({
      parentId: parentId || 'null',
      pageSize: pageSize || '50'
    })

    const endpoint = `/api/files/list?${params}`

    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: errorData.error || `Error HTTP: ${response.status}` 
      }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error en proxy de archivos GET:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}
