export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  settings: UserSettings
}

export interface UserSettings {
  monthlyBudget: number
  currency: CurrencyCode
  budgetLimits: Record<BudgetLimit, number>
  notifications: boolean
  theme: Theme
}

// Default settings with all numeric values set to 0
export const DEFAULT_USER_SETTINGS: UserSettings = {
  monthlyBudget: 0,
  currency: 'PHP',
  budgetLimits: {
    food_dining: 0,
    transportation: 0,
    bills_utilities: 0,
    groceries: 0,
    entertainment: 0,
    healthcare: 0,
    shopping: 0,
    others: 0
  },
  notifications: true,
  theme: 'system'
}

export type CurrencyCode =
  | 'PHP'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CAD'
  | 'AUD'
  | 'CNY'

export type BudgetCategory = string

export type BudgetLimit =
  | 'food_dining'
  | 'transportation'
  | 'bills_utilities'
  | 'groceries'
  | 'entertainment'
  | 'healthcare'
  | 'shopping'
  | 'others';

export type Theme = 'light' | 'dark' | 'system'


