import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { ExtractedData, ReceiptItem } from '@/types/receipt'

// Mock OCR processing since we can't use EasyOCR directly in Next.js API routes
// In a real implementation, this would call a backend service with EasyOCR
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

    // Process the image
    // In a real implementation, this would send the image to a backend service with EasyOCR
    // For now, we'll simulate OCR results
    const extractedData = await simulateOCRProcessing(imageFile)

    return NextResponse.json(extractedData)
  } catch (error) {
    console.error('OCR processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    )
  }
}

// Simulate OCR processing with realistic data
async function simulateOCRProcessing(image: File): Promise<ExtractedData> {
  // In a real implementation, this would use EasyOCR to extract text from the image
  // For now, we'll return mock data

  // Generate random items
  const itemCount = Math.floor(Math.random() * 5) + 1
  const items: ReceiptItem[] = []

  for (let i = 0; i < itemCount; i++) {
    const price = parseFloat((Math.random() * 50 + 5).toFixed(2))
    const quantity = Math.floor(Math.random() * 3) + 1

    items.push({
      name: `Item ${i + 1}`,
      price,
      quantity
    })
  }

  // Calculate total
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = parseFloat((subtotal * 0.12).toFixed(2))
  const total = parseFloat((subtotal + tax).toFixed(2))

  // Generate random text that looks like a receipt
  const rawText = `
STORE NAME
123 Main Street
City, State 12345
Tel: (123) 456-7890

Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

${items.map(item => `${item.name.padEnd(20)} ${item.quantity} x $${item.price.toFixed(2)} $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Subtotal: $${subtotal.toFixed(2)}
Tax (12%): $${tax.toFixed(2)}
Total: $${total.toFixed(2)}

Thank you for shopping with us!
  `.trim()

  return {
    vendor: 'Store Name',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString(),
    total,
    tax,
    change: 0,
    items,
    rawText
  }
}
