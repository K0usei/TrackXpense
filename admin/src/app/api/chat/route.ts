import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Early return if no user in session
    if (!session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { message } = await req.json()

    // Fetch user's financial data for context
    const [expenses, budget] = await Promise.all([
      db.expense.findMany({
        where: { userId: session.user.id },
        orderBy: { date: 'desc' },
        take: 10
      }),
      db.budget.findFirst({
        where: {
          userId: session.user.id,
          period: 'monthly' // Get monthly budget for income reference
        }
      })
    ])

    // Format context for the AI
    const context = {
      recentExpenses: expenses,
      monthlyBudget: budget?.limit ?? 0,
      monthlyIncome: budget?.limit ?? 0 // Using limit as income since that's what's in the schema
    }

    // Call your AI service with context
    const response = await fetch(process.env.AI_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context
      })
    })

    const data = await response.json()

    return NextResponse.json({ response: data.response })
  } catch (error) {
    console.error('Chat API error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
