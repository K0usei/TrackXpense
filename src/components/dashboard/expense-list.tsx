"use client"

import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

interface Expense {
  id: string
  amount: number
  description: string
  date: string
  category: string
}

interface ExpenseListProps {
  expenses: Expense[]
  loading?: boolean
}

export function ExpenseList({ expenses, loading = false }: ExpenseListProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div>Loading expenses...</div>
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="p-4">
        <div>No expenses found</div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between border-b pb-4 last:border-0"
          >
            <div>
              <h3 className="font-medium">{expense.description}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(expense.date), "PPP")} • {expense.category}
              </p>
            </div>
            <div className="font-medium">
              {formatCurrency(expense.amount)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}