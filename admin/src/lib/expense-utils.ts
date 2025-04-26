import { format, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subMonths } from 'date-fns'
import type { Expense, ExpenseData, TimeFrame } from '@/types/expense'

export function aggregateExpenses(
  expenses: Expense[],
  timeframe: TimeFrame
): ExpenseData[] {
  const now = new Date()
  const sixMonthsAgo = subMonths(now, 6)

  switch (timeframe) {
    case 'daily': {
      const days = eachDayOfInterval({ start: sixMonthsAgo, end: now })
      return days.map(day => {
        const dayExpenses = expenses.filter(expense => 
          format(new Date(expense.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        )
        return {
          date: format(day, 'MMM dd'),
          amount: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        }
      })
    }
    case 'weekly': {
      const weeks = eachWeekOfInterval({ start: sixMonthsAgo, end: now })
      return weeks.map(week => {
        const weekExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date)
          const weekStart = startOfWeek(week)
          const nextWeekStart = startOfWeek(new Date(week.getTime() + 7 * 24 * 60 * 60 * 1000))
          return expenseDate >= weekStart && expenseDate < nextWeekStart
        })
        return {
          date: format(week, 'MMM dd'),
          amount: weekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        }
      })
    }
    case 'monthly': {
      const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })
      return months.map(month => {
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date)
          const monthStart = startOfMonth(month)
          const nextMonthStart = startOfMonth(new Date(month.getTime() + 31 * 24 * 60 * 60 * 1000))
          return expenseDate >= monthStart && expenseDate < nextMonthStart
        })
        return {
          date: format(month, 'MMM yyyy'),
          amount: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        }
      })
    }
    default:
      return []
  }
}