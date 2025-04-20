import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import type { UserProfile } from '@/types/user'
import { CategoryType, categoryColors } from '@/lib/colors'
import { budgetLimitToCategoryType, snakeCaseToCategoryType, getCategoryColorForAnyFormat } from '@/lib/category-utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { generatePlaceholderData } from '@/lib/chart-utils'

interface DashboardData {
  categoryDistribution: Array<{
    name: string
    value: number
  }>
  spendingTrends: Array<{
    date: Date
    amount: number
  }>
  monthlyBudget: number
  monthlyIncome: number
  budgetOverview: Array<{
    category: CategoryType
    spent: number
    budget: number
    color: string
  }>
  currency: string
}

const defaultData: DashboardData = {
  categoryDistribution: [
    { name: 'Food & Dining', value: 20 },
    { name: 'Transportation', value: 20 },
    { name: 'Others', value: 20 },
    { name: 'Bills & Utilities', value: 20 },
    { name: 'Entertainment', value: 20 }
  ],
  spendingTrends: Array.from({ length: 7 }, (_, i) => {
    return {
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      amount: 0
    }
  }).reverse(),
  monthlyBudget: 0,
  monthlyIncome: 0,
  budgetOverview: [],
  currency: 'PHP'
}

export function useDashboardData(timeframe: 'daily' | 'weekly' | 'monthly') {
  // Initialize with null instead of defaultData
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (!user) return

      setLoading(true)
      try {
        // Fetch user profile to get monthly budget and income
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const userProfile = userDoc.data() as UserProfile

        // Generate spending trends with zero values for all timeframes
        // In a real app, this would fetch actual expense data from the database
        const spendingTrends = generatePlaceholderData(timeframe).map(item => ({
          date: new Date(item.date),
          amount: 0 // Use zero as placeholder since there are no expenses yet
        }))

        // Convert budget limits to category distribution
        const budgetLimits = userProfile.settings.budgetLimits || {}

        // Create category distribution based on budget limits
        const categoryDistribution = Object.entries(budgetLimits).map(([category, value]) => {
          // Convert snake_case to display format using our utility function
          const displayName = snakeCaseToCategoryType(category)

          return {
            name: displayName,
            value: value > 0 ? value : 20 // Use 20 as placeholder if value is 0
          }
        })

        // Create budget overview with spending data
        const budgetOverview = Object.entries(budgetLimits).map(([category, budget]) => {
          // Convert snake_case to CategoryType using our utility function
          const categoryType = snakeCaseToCategoryType(category)

          // Set spent amount to zero since there are no actual expenses yet
          // In a real app, this would come from actual expense data
          const spent = 0

          return {
            category: categoryType,
            spent,
            budget,
            color: getCategoryColorForAnyFormat(categoryType)
          }
        })

        if (isMounted) {
          setData({
            categoryDistribution,
            spendingTrends,
            monthlyBudget: userProfile.settings.monthlyBudget || 0,
            monthlyIncome: userProfile.settings.monthlyIncome || 0,
            budgetOverview,
            currency: userProfile.settings.currency || 'PHP'
          })
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch dashboard data')
          setData(null) // Reset data on error
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [timeframe, user])

  return { data, loading, error }
}

// Define the Expense type
interface Expense {
  date: Date
  amount: number
  category: string
}

interface SpendingDataPoint {
  name: string
  date: Date
  [category: string]: number | string | Date
}

// Use the centralized color system

// Helper function to get category color - use the centralized function
function getLocalCategoryColor(category: CategoryType): string {
  return getCategoryColorForAnyFormat(category)
}

function processSpendingTrends(expenses: Expense[]): SpendingDataPoint[] {
  // Group expenses by date and category
  const groupedByDate = expenses.reduce((acc, expense) => {
    const dateKey = expense.date.toLocaleDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = {
        name: dateKey,
        date: expense.date,
        ...Object.fromEntries(
          EXPENSE_CATEGORIES.map((category: string): [string, number] => [category, 0])
        )
      } as SpendingDataPoint
    }
    acc[dateKey][expense.category] = (acc[dateKey][expense.category] as number) + expense.amount
    return acc
  }, {} as Record<string, SpendingDataPoint>)

  // Convert to array and sort by date
  return Object.values(groupedByDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function processCategoryDistribution(expenses: Expense[]) {
  const grouped = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = 0
    acc[exp.category] += exp.amount
    return acc
  }, {} as Record<string, number>)

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    value
  }))
}

function formatDate(date: Date, timeframe: string): string {
  switch (timeframe) {
    case 'daily':
      return date.toLocaleDateString()
    case 'weekly':
      return `Week ${getWeekNumber(date)}`
    case 'monthly':
      return date.toLocaleDateString('default', { month: 'short' })
    default:
      return date.toLocaleDateString()
  }
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}






