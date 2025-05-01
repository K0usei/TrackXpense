'use client'

import { Card } from "@/components/ui/card"
import { DonutChart } from "@/components/dashboard/DonutChart"
import { BarGraph } from "@/components/dashboard/BarGraph"
import { DashboardStats } from "@/components/dashboard/Stats"
import { ExpenseFilter } from "@/components/dashboard/expense-filter"
import { useState } from "react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/constants'

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const { data, loading, error } = useDashboardData(timeframe)

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  // Get the monthly budget from user settings - this should not change with timeframe
  const monthlyBudget = data?.monthlyBudget || 0

  // Calculate total expenses based on the selected timeframe
  // For now, it's 0 since we're using placeholder data
  const totalExpenses = (!loading && data?.spendingTrends)
    ? data.spendingTrends.reduce((sum, item) => sum + item.amount, 0)
    : 0

  // Get the total monthly expenses from the data object
  // This value is not affected by the timeframe filter
  const totalMonthlyExpenses = data?.totalMonthlyExpenses || 0

  // Calculate the remaining balance based on monthly budget minus MONTHLY expenses
  // This ensures the remaining balance is not affected by the timeframe filter
  const remainingBalance = monthlyBudget - totalMonthlyExpenses

  // Avoid NaN in percentage calculations
  const safeMonthlyBudget = monthlyBudget || 1 // Use 1 to avoid division by zero

  const currency = data?.currency || 'PHP'

  // We don't need to transform the data anymore as we're using budgetOverview directly
  const categoryData = data?.budgetOverview || []

  const formattedData = data?.spendingTrends?.map(item => ({
    name: new Date(item.date).toLocaleDateString(),
    date: item.date.toISOString(),
    amount: item.amount,
  }))

  return (
    <div className="space-y-2 pb-0 lg:pb-8">
      <div className="flex flex-col items-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <DashboardStats
        totalExpenses={totalExpenses}
        monthlyBudget={monthlyBudget}
        remainingBalance={remainingBalance}
        loading={loading}
        currency={currency}
        timeframe={timeframe}
      />

      {/* Timeframe Filter */}
      <div className="flex justify-center mt-8">
        <ExpenseFilter timeframe={timeframe} setTimeframe={setTimeframe} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-8 lg:grid-cols-2 mt-2">
        <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-violet-500/40 to-violet-500/10 hover:from-violet-500/50 hover:to-violet-500/20 backdrop-blur-sm border-0">
          <div className="flex flex-col gap-2 sm:gap-4 h-full">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-medium">Expense Categories</h3>
              <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
              </div>
            </div>
            <div className="flex-1 min-h-[250px]">
              <DonutChart
                data={data?.budgetOverview || []}
                loading={loading}
                currency={currency}
              />
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 backdrop-blur-sm border-0">
          <div className="flex flex-col gap-2 sm:gap-4 h-full">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-medium">Spending Overview</h3>
              <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
              </div>
            </div>
            <div className="flex-1 min-h-[250px]">
              <BarGraph
                data={formattedData}
                loading={loading}
                timeFilter={timeframe}
                currency={currency}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}




