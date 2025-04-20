/// <reference types="next" />

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { subDays, subWeeks, subMonths, subYears, startOfDay, format } from 'date-fns'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/constants'

interface Expense {
  date: Date
  amount: number
  category: ExpenseCategory
}

interface GroupedExpenseData {
  date: string
  amount: number
  [key: string]: number | string // for dynamic category properties
}

type GroupedExpenses = Record<string, GroupedExpenseData>

const validCategories = EXPENSE_CATEGORIES

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await auth()

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to access this data' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly'

    // Calculate date range based on period
    const now = new Date()
    let startDate = startOfDay(now)

    switch (period) {
      case 'daily':
        startDate = subDays(now, 7) // Last 7 days
        break
      case 'weekly':
        startDate = subWeeks(now, 4) // Last 4 weeks
        break
      case 'monthly':
        startDate = subMonths(now, 6) // Last 6 months
        break
      case 'yearly':
        startDate = subYears(now, 1) // Last year
        break
    }

    // Fetch expenses grouped by date and category
    const rawExpenses = await db.expense.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: now
        }
      },
      include: {
        category: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    const expenses: Expense[] = rawExpenses.map(expense => ({
      date: expense.date,
      amount: expense.amount,
      category: expense.category.name as ExpenseCategory
    }))

    // Group expenses by date
    const groupedExpenses = expenses.reduce<GroupedExpenses>((acc, expense) => {
      const dateStr = formatDateByPeriod(expense.date, period)

      if (!acc[dateStr]) {
        acc[dateStr] = {
          date: dateStr,
          amount: 0,
          ...Object.fromEntries(validCategories.map(cat => [cat, 0])),
          Others: 0
        }
      }

      acc[dateStr].amount += expense.amount

      // Add to specific category
      const category = expense.category
      if (validCategories.includes(category)) {
        acc[dateStr][category] = (acc[dateStr][category] as number) + expense.amount
      } else {
        acc[dateStr].Others = (acc[dateStr].Others as number) + expense.amount
      }

      return acc
    }, {})

    // Convert to array and sort by date
    const formattedData = Object.values(groupedExpenses)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Failed to fetch spending data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatDateByPeriod(date: Date, period: string): string {
  switch (period) {
    case 'daily':
      return format(date, 'MMM dd')
    case 'weekly':
      return format(date, 'MMM dd')
    case 'monthly':
      return format(date, 'MMM yyyy')
    case 'yearly':
      return format(date, 'MMM yyyy')
    default:
      return format(date, 'MMM dd, yyyy')
  }
}









