'use client'

import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: 'expense' | 'income'
}

interface TransactionListProps {
  transactions: Transaction[]
  loading?: boolean
}

export function TransactionList({ transactions, loading = false }: TransactionListProps) {
  if (loading) {
    return (
      <Card className="p-4">
        <div className="h-[300px] flex items-center justify-center">
          Loading transactions...
        </div>
      </Card>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          No transactions found
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
          >
            <div className="space-y-1">
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.category} • {format(new Date(transaction.date), "PPP")}
              </p>
            </div>
            <p className={`font-medium ${
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount))}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}