import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

// Proxy to backend OCR service
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get form data with image
    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    // Forward the request to the backend service
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000/api'
    const response = await fetch(`${backendUrl}/ocr/process-receipt`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend OCR service error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend service error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('OCR processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}
