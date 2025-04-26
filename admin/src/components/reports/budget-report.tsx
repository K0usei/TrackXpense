'use client'

import { useEffect, useState } from 'react'
import { BudgetComparison } from './budget-comparison'
import { Card } from '@/components/ui/card'

interface BudgetReportProps {
  timeFilter: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

interface BudgetSummary {
  expenses: number
  income: number
  categoryData: Array<{
    category: string
    amount: number
  }>
}

export default function BudgetReport({ timeFilter }: BudgetReportProps) {
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBudgetSummary = async () => {
      try {
        const response = await fetch(`/api/reports/budget-summary?period=${timeFilter}`)
        const data = await response.json()
        setBudgetSummary(data)
      } catch (error) {
        console.error('Failed to fetch budget summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBudgetSummary()
  }, [timeFilter])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!budgetSummary) {
    return <div>No budget data available</div>
  }

  return (
    <Card className="p-6">
      <BudgetComparison
        expenses={budgetSummary.expenses}
        income={budgetSummary.income}
        categoryData={budgetSummary.categoryData}
      />
    </Card>
  )
}

