import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  format,
  parseISO
} from 'date-fns'

interface Activity {
  id: string
  date: string
  description: string
  amount: number
  category: string
  merchant: string
}

interface ExpenseData {
  activities: Activity[]
  totalExpenses: number
  categoryBreakdown: {
    category: string
    amount: number
    percentage: number
  }[]
  spendingTrendsByCategory: Record<string, any>[]
  currency: string
}

export function useExpenseData(timeframe: 'daily' | 'weekly' | 'monthly') {
  const [data, setData] = useState<ExpenseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:8000/api'

  useEffect(() => {
    async function fetchExpenseData() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Get user settings for currency directly by document ID
        let currency = 'PHP'
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDocSnap = await getDoc(userDocRef)

          // Check if user document exists
          if (!userDocSnap.exists()) {
            console.error('User document not found for uid:', user.uid)
            setError('User profile not found. Please set up your profile first.')
            setLoading(false)
            return
          }

          // Get currency from user settings
          const userData = userDocSnap.data()
          if (userData.settings && userData.settings.currency) {
            currency = userData.settings.currency
          }
        } catch (userDocError) {
          console.error('Error fetching user document:', userDocError)
          // Continue with default currency
        }

        // Get date range based on timeframe
        const now = new Date()
        let startDate: Date
        let endDate: Date

        switch (timeframe) {
          case 'daily':
            startDate = startOfDay(now)
            endDate = endOfDay(now)
            break
          case 'weekly':
            startDate = startOfWeek(now)
            endDate = endOfWeek(now)
            break
          case 'monthly':
            startDate = startOfMonth(now)
            endDate = endOfMonth(now)
            break
        }

        // Fetch expenses
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid),
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        )

        const expensesSnapshot = await getDocs(expensesQuery)
        const expenses = expensesSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            date: format(data.date.toDate(), 'yyyy-MM-dd'),
            description: data.description,
            amount: data.amount,
            category: data.category,
            merchant: data.merchant
          }
        })

        // Fetch receipts from backend API
        try {
          const formattedStartDate = format(startDate, 'yyyy-MM-dd')
          const formattedEndDate = format(endDate, 'yyyy-MM-dd')

          const receiptsResponse = await fetch(
            `${API_BASE}/receipts?user_id=${user.uid}&start_date=${formattedStartDate}&end_date=${formattedEndDate}`
          )

          if (receiptsResponse.ok) {
            const receiptsData = await receiptsResponse.json()

            // Convert receipts to the same format as expenses
            const receiptExpenses = receiptsData.map((receipt: any) => ({
              id: receipt.id,
              date: format(parseISO(receipt.date), 'yyyy-MM-dd'),
              description: receipt.vendor || 'Receipt',
              amount: receipt.total || 0,
              category: receipt.category || 'Others',
              merchant: receipt.vendor
            }))

            // Combine expenses from Firestore and receipts from PostgreSQL
            expenses.push(...receiptExpenses)

            console.log('Fetched receipts:', receiptExpenses.length)
          } else {
            console.error('Failed to fetch receipts:', receiptsResponse.status)
          }
        } catch (receiptError) {
          console.error('Error fetching receipts:', receiptError)
          // Continue with Firestore expenses even if receipt fetch fails
        }

        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)

        // Calculate category breakdown
        const categoryTotals = expenses.reduce((acc, expense) => {
          if (!acc[expense.category]) {
            acc[expense.category] = 0
          }
          acc[expense.category] += expense.amount
          return acc
        }, {} as Record<string, number>)

        const categoryBreakdown = Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: (amount / totalExpenses) * 100
          }))
          // Sort by amount in descending order
          .sort((a, b) => b.amount - a.amount)

        // Prepare data for multi-line chart by category
        // Group expenses by date and category
        const expensesByDate = expenses.reduce((acc, expense) => {
          const date = expense.date
          if (!acc[date]) {
            acc[date] = {}
          }
          if (!acc[date][expense.category]) {
            acc[date][expense.category] = 0
          }
          acc[date][expense.category] += expense.amount
          return acc
        }, {} as Record<string, Record<string, number>>)

        // Convert to array format for the chart
        const spendingTrendsByCategory = Object.entries(expensesByDate).map(([date, categories]) => {
          const result: Record<string, any> = { date }
          Object.entries(categories).forEach(([category, amount]) => {
            result[category] = amount
          })
          return result
        })

        // Sort by date
        spendingTrendsByCategory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setData({
          activities: expenses,
          totalExpenses,
          categoryBreakdown,
          spendingTrendsByCategory,
          currency
        })
        setError(null)

      } catch (error) {
        console.error('Error fetching expense data:', error)
        setError('Failed to fetch expense data. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchExpenseData()
  }, [timeframe, user])

  return { data, loading, error }
}