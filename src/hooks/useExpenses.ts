import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import type { Expense } from '@prisma/client'

export function useExpenses(userId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExpenses() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        const expenseData = await db.expense.findMany({
          where: {
            userId: userId
          },
          orderBy: {
            date: 'desc'
          },
          include: {
            category: true
          }
        })

        setExpenses(expenseData)
        setError(null)
      } catch (err) {
        setError('Failed to fetch expenses')
        console.error('Error fetching expenses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [userId])

  return { expenses, loading, error }
}
