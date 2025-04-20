import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { startOfDay, subDays, subWeeks, subMonths, subYears } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly'
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Calculate date range
    const now = new Date()
    let startDate = startOfDay(now)

    switch (period) {
      case 'daily':
        startDate = subDays(now, 1)
        break
      case 'weekly':
        startDate = subWeeks(now, 1)
        break
      case 'monthly':
        startDate = subMonths(now, 1)
        break
      case 'yearly':
        startDate = subYears(now, 1)
        break
    }

    // Fetch user's expenses
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        expenses: {
          where: {
            date: {
              gte: startDate,
              lte: now
            }
          }
        }
      }
    })

    // Calculate total expenses
    const totalExpenses = user?.expenses.reduce((sum, exp) => sum + exp.amount, 0) || 0

    // Get expenses by category
    const categoryData = await db.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        amount: true
      },
      _count: true
    })

    // Fetch category names
    const categories = await db.category.findMany({
      where: {
        id: {
          in: categoryData.map(cat => cat.categoryId)
        }
      }
    })

    const formattedCategoryData = categoryData.map(cat => {
      const categoryName = categories.find(c => c.id === cat.categoryId)?.name || 'Unknown'
      return {
        category: categoryName,
        amount: cat._sum?.amount || 0
      }
    })

    // Fetch monthly income from budget table
    const monthlyBudget = await db.budget.findFirst({
      where: {
        userId: session.user.id,
        period: 'monthly'
      }
    })

    return NextResponse.json({
      expenses: totalExpenses,
      income: monthlyBudget?.limit || 0,
      categoryData: formattedCategoryData
    })
  } catch (error) {
    console.error('Failed to fetch budget summary:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
