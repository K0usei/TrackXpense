/// <reference types="next" />

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import type { NextRequest } from 'next/server'
import { subDays, subWeeks, subMonths, subYears, startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url.toString())
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' | 'yearly'
    const session = await auth()

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Calculate date range based on period
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

    // Fetch budget data and spending data to compare
    const budgetData = await db.budget.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        category: {
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
        }
      }
    })

    interface BudgetSummary {
      category: string;
      spent: number;
      limit: number;
    }

    interface Budget {
      id: number;
      period: string;
      categoryId: number;
      userId: string;
      createdAt: Date;
      updatedAt: Date;
      limit: number;
      category: {
        name: string;
        expenses: {
          amount: number;
        }[];
      };
    }

    const formattedData: BudgetSummary[] = (budgetData as Budget[]).map((budget) => ({
      category: budget.category.name,
      spent: budget.category.expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0),
      limit: budget.limit
    }))

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Failed to fetch budget data:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}


