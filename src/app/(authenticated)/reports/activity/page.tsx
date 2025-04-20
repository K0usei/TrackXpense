'use client'

import { useState } from 'react'
import { Card } from "@/components/ui/card"
import { ExpenseFilter } from "@/components/dashboard/expense-filter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useExpenseData } from "@/hooks/useExpenseData"
import { ErrorBoundary } from "@/components/error-boundary"
import { formatCurrency } from "@/lib/utils"
import ActivityReport from "@/components/reports/activity-report"
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { categoryColors, CategoryType } from '@/lib/colors'
import {
  Receipt,
  LayoutList,
  Utensils,
  Car,
  Building2,
  ShoppingBag,
  Popcorn,
  Heart,
  HelpCircle
} from 'lucide-react'

// Category icon mapping
const categoryIcons = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Bills & Utilities': Building2,
  'Groceries': ShoppingBag,
  'Entertainment': Popcorn,
  'Healthcare': Heart,
  'Shopping': ShoppingBag,
  'Others': HelpCircle
} as const

export default function ActivityReportsPage() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('monthly')
  const { data, loading, error } = useExpenseData(timeframe)
  const currency = data?.currency || 'PHP'

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-4">
        <AlertDescription>
          {error}. Please try again later or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    )
  }

  const spendingTrendsData = data?.activities.map(activity => ({
    date: activity.date,
    amount: activity.amount
  })) || []

  const categoryData = data?.categoryBreakdown.map(category => ({
    category: category.category,
    amount: category.amount
  })) || []

  // Create default categories with 0 amounts
  const defaultCategories = EXPENSE_CATEGORIES.map(category => ({
    category,
    amount: 0
  }))

  // Merge actual data with default categories
  const mergedCategoryData = defaultCategories.map(defaultCat => {
    const actualData = categoryData.find(item => item.category === defaultCat.category)
    return {
      ...defaultCat,
      amount: actualData?.amount || 0
    }
  })

  // Sort by amount in descending order
  mergedCategoryData.sort((a, b) => b.amount - a.amount)

  return (
    <ErrorBoundary>
      <div className="space-y-4 pb-0 lg:pb-8">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Activity Report</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-violet-500/30 to-violet-500/5 hover:from-violet-500/40 hover:to-violet-500/10 backdrop-blur-sm border-0">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Transactions
                </p>
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
              </div>
              <p className="text-lg sm:text-2xl font-semibold truncate">
                {loading ? "..." : data?.activities.length || 0}
              </p>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 hover:from-cyan-500/40 hover:to-cyan-500/10 backdrop-blur-sm border-0">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Top Category
                </p>
                <LayoutList className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
              </div>
              <p className="text-lg sm:text-2xl font-semibold truncate">
                {loading ? "..." : data?.categoryBreakdown[0]?.category || "N/A"}
              </p>
            </div>
          </Card>
        </div>

        {/* Timeframe Filter */}
        <div className="flex justify-center">
          <ExpenseFilter timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>

        {/* Line Chart */}
        <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-teal-500/30 to-teal-500/5 hover:from-teal-500/40 hover:to-teal-500/10 backdrop-blur-sm border-0">
          <div className="flex flex-col gap-4 h-[300px] sm:h-[350px] lg:h-[400px]">
            <h3 className="text-base sm:text-lg font-medium">Expense Trends</h3>
            <div className="flex-1">
              <ActivityReport
                data={data?.spendingTrendsByCategory}
                timeFilter={timeframe}
                loading={loading}
                currency={currency}
              />
            </div>
          </div>
        </Card>

        {/* Category Breakdown with Gradient Colors and Icons */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {mergedCategoryData.map((item) => {
              const categoryKey = item.category as CategoryType;
              const color = categoryColors[categoryKey];
              const IconComponent = categoryIcons[categoryKey];

              return (
                <div
                  key={item.category}
                  className="p-4 rounded-xl transition-all duration-300 backdrop-blur-sm border-0 hover:shadow-md"
                  style={{
                    background: `linear-gradient(to right bottom, ${color}20, ${color}05)`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${color}15`,
                        }}
                      >
                        <IconComponent
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          style={{ color: color }}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{item.category}</p>
                        {!loading && (
                          <p className="text-sm text-muted-foreground">
                            {((item.amount / (data?.totalExpenses || 1)) * 100).toFixed(1)}% of total
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {loading ? (
                          <span className="text-muted-foreground">...</span>
                        ) : (
                          formatCurrency(item.amount, currency)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  )
}



















