export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Bills & Utilities',
  'Groceries',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Others'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]