import { BudgetLimit } from '@/types/user'
import { CategoryType, getCategoryColor } from '@/lib/colors'

// Mapping from BudgetLimit (snake_case) to CategoryType (Title Case)
const BUDGET_LIMIT_TO_CATEGORY_TYPE: Record<BudgetLimit, CategoryType> = {
  'food_dining': 'Food & Dining',
  'transportation': 'Transportation',
  'bills_utilities': 'Bills & Utilities',
  'groceries': 'Groceries',
  'entertainment': 'Entertainment',
  'healthcare': 'Healthcare',
  'shopping': 'Shopping',
  'others': 'Others'
}

// Convert a BudgetLimit key to a CategoryType
export function budgetLimitToCategoryType(budgetLimit: BudgetLimit): CategoryType {
  return BUDGET_LIMIT_TO_CATEGORY_TYPE[budgetLimit]
}

// Convert a snake_case string to Title Case with spaces
export function formatCategoryName(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Convert a snake_case string to CategoryType (with special handling for '&')
export function snakeCaseToCategoryType(snakeCase: string): CategoryType {
  // Special case for food_dining -> Food & Dining
  if (snakeCase === 'food_dining') return 'Food & Dining'

  // Special case for bills_utilities -> Bills & Utilities
  if (snakeCase === 'bills_utilities') return 'Bills & Utilities'

  // Default formatting for other categories
  return formatCategoryName(snakeCase) as CategoryType
}

// Get color for a category in any format (snake_case or display format)
export function getCategoryColorForAnyFormat(category: string): string {
  // If it's snake_case, try to convert it first
  if (category.includes('_')) {
    try {
      const categoryType = snakeCaseToCategoryType(category)
      return getCategoryColor(categoryType)
    } catch (error) {
      console.warn(`Error converting category: ${category}`, error)
    }
  }

  // Otherwise use the category name directly
  return getCategoryColor(category)
}
