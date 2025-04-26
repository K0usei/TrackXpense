'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { categoryColors, CategoryType } from '@/lib/colors'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface BudgetCategory {
  category: CategoryType
  spent: number
  budget: number
  color: string
}

interface BudgetOverviewProps {
  categories: BudgetCategory[]
  loading?: boolean
}

const defaultCategories: BudgetCategory[] = EXPENSE_CATEGORIES.map(category => ({
  category,
  spent: 0,
  budget: 0,
  color: categoryColors[category]
}))

export function BudgetOverview({ categories = defaultCategories, loading = false }: BudgetOverviewProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          Loading...
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
      <div className="space-y-6">
        {categories.map((item) => {
          const percentage = (item.spent / item.budget) * 100
          return (
            <div key={item.category} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{item.category}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                </span>
              </div>
              <Progress
                value={percentage}
                style={{ "--progress-background": item.color } as React.CSSProperties}
              />
            </div>
          )
        })}
      </div>
    </Card>
  )
}



