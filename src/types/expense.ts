export interface Expense {
  id: string
  amount: number
  description: string
  date: string
  category: string
  userId: string
}

export interface ExpenseData {
  date: string
  amount: number
}

export type TimeFrame = 'daily' | 'weekly' | 'monthly'