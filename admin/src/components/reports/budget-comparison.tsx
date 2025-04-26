'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { CategoryType } from '@/lib/colors'
import { getCategoryColorForAnyFormat } from '@/lib/category-utils'

interface BudgetComparisonProps {
  expenses: number
  income: number
  categoryData: Array<{
    category: string
    amount: number
  }>
}

export function BudgetComparison({ expenses, income, categoryData }: BudgetComparisonProps) {
  const savingsPercentage = ((income - expenses) / income) * 100
  const isOverspending = expenses > income

  const getStatusColor = (percentage: number) => {
    return getStatusColorByPercentage(percentage)
  }

  const getProgressColor = (percentage: number) => {
    return getStatusColorByPercentage(percentage)
  }

  const getBarColor = (category: string) => {
    return getCategoryColorForAnyFormat(category)
  }

  return (
    <div className="space-y-6">
      {/* Expenses vs Income Comparison */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Monthly Income</span>
              <span>{formatCurrency(income)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Total Expenses</span>
              <span className={cn(isOverspending ? 'text-red-500' : 'text-green-500')}>
                {formatCurrency(expenses)}
              </span>
            </div>
          </div>
          <Progress
            value={(expenses / income) * 100}
            className={getProgressColor((expenses / income) * 100)}
          />
        </div>
      </Card>

      {/* Savings Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Savings Summary</h3>
        <div className={cn("text-3xl font-bold mb-2", getStatusColor(savingsPercentage))}>
          {savingsPercentage.toFixed(1)}% {isOverspending ? 'Overspent' : 'Saved'}
        </div>
        {isOverspending && (
          <Alert variant="destructive">
            <AlertDescription>
              You are currently overspending. Consider reviewing your expenses.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Category Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar
                dataKey="amount"
                fill="hsl(var(--accent))"
                data={categoryData.map(item => ({
                  ...item,
                  fill: getBarColor(item.category)
                }))}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

function getStatusColorByPercentage(percentage: number) {
  if (percentage < 0) {
    return 'text-red-500'; // Overspending
  } else if (percentage >= 0 && percentage <= 50) {
    return 'text-yellow-500'; // Moderate savings
  } else {
    return 'text-green-500'; // Good savings
  }
}

