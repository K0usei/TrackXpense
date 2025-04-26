'use client'

import { Progress } from '../ui/progress'
import { categoryColors } from '@/lib/colors'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

const budgetCategories = EXPENSE_CATEGORIES.map(category => ({
    category,
    spent: 0,
    budget: 0,
    color: categoryColors[category]
}))

export function BudgetProgress() {
    return (
        <div className="space-y-6">
            {budgetCategories.map((item) => {
                const percentage = (item.spent / item.budget) * 100
                return (
                    <div key={item.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{item.category}</span>
                            <span className="text-muted-foreground">
                                ${item.spent} / ${item.budget}
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
    )
}


