import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace this with actual database fetch
    const mockReceipts = [
      {
        id: '1',
        vendor: 'Walmart',
        date: '2024-01-15T10:30:00Z',
        total: 156.78,
        category: 'Groceries',
        imageUrls: ['/placeholder-receipt.jpg'],
        items: [
          { name: 'Groceries', quantity: 1, price: 156.78 }
        ]
      },
      {
        id: '2',
        vendor: 'Target',
        date: '2024-01-14T15:45:00Z',
        total: 89.99,
        category: 'Shopping',
        imageUrls: ['/placeholder-receipt.jpg'],
        items: [
          { name: 'Household items', quantity: 1, price: 89.99 }
        ]
      }
    ]

    return NextResponse.json(mockReceipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    // TODO: Add validation and database storage
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    )
  }
}