import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { useAuth } from '@/hooks/useAuth'
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth
} from 'date-fns'

interface Category {
  name: string
  spent: number
  budget: number
}

interface BudgetData {
  totalBudget: number
  totalSpent: number
  categories: Category[]
  loading: boolean
  error: string | null
  currency: string
}

export function useBudgetData(timeframe: 'daily' | 'weekly' | 'monthly') {
  const [data, setData] = useState<BudgetData>({
    totalBudget: 0,
    totalSpent: 0,
    categories: [],
    loading: true,
    error: null,
    currency: 'PHP'
  })
  const { user } = useAuth()

  useEffect(() => {
    async function fetchBudgetData() {
      if (!user) {
        setData(prev => ({ ...prev, loading: false }))
        return
      }

      try {
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

        // Fetch expenses within the timeframe
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        )

        const expensesSnapshot = await getDocs(expensesQuery)
        const expenses = expensesSnapshot.docs.map(doc => doc.data())

        // Fetch user's budget settings
        const userDoc = await getDocs(query(
          collection(db, 'users'),
          where('uid', '==', user.uid)
        ))

        // Check if user document exists
        if (userDoc.empty) {
          console.error('User document not found for uid:', user.uid)
          setData(prev => ({
            ...prev,
            loading: false,
            error: 'User profile not found. Please set up your profile first.'
          }))
          return
        }

        const userData = userDoc.docs[0].data()
        const userSettings = userData.settings || {}
        const monthlyBudget = userSettings.monthlyBudget || 0
        const budgetLimits = userSettings.budgetLimits || {}
        const currency = userSettings.currency || 'PHP'

        // Don't adjust budget limits based on timeframe - they should remain the same
        // regardless of the selected timeframe
        const adjustedBudgetLimits = Object.entries(budgetLimits).reduce((acc, [category, amount]) => {
          acc[category] = Number(amount)
          return acc
        }, {} as Record<string, number>)

        // Calculate spending by category
        const categorySpending = expenses.reduce((acc, expense) => {
          const category = expense.category
          if (!acc[category]) {
            acc[category] = 0
          }
          acc[category] += expense.amount
          return acc
        }, {} as Record<string, number>)

        // Format data for return
        const categories = Object.entries(adjustedBudgetLimits).map(([category, budget]) => {
          // Convert snake_case to display format
          const displayName = category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
            .replace('Food Dining', 'Food & Dining')
            .replace('Bills Utilities', 'Bills & Utilities')

          return {
            name: displayName,
            spent: categorySpending[category] || 0,
            budget: Number(budget)
          }
        })

        // Use the budget from user settings - not affected by timeframe
        const totalBudget = monthlyBudget
        // Total spent is based on the selected timeframe
        const totalSpent = Object.values(categorySpending).reduce((sum, amount) => sum + amount, 0)

        setData({
          totalBudget,
          totalSpent,
          categories,
          loading: false,
          error: null,
          currency: currency || 'PHP'
        })
      } catch (error) {
        console.error('Error fetching budget data:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch budget data. Please check your connection and try again.'
        }))
      }
    }

    fetchBudgetData()
  }, [user, timeframe])

  return data
}
