// Predefined category colors that complement the app's main accent color (262 83% 58%)
export const categoryColors = {
  'Food & Dining': 'hsl(var(--accent-red))',          // accent red
  'Entertainment': 'hsl(var(--accent-purple))',       // accent purple
  'Shopping': 'hsl(var(--accent-blue))',              // accent blue
  'Transportation': 'hsl(var(--accent-green))',       // accent green
  'Bills & Utilities': 'hsl(var(--accent-gold))',     // accent gold
  'Groceries': 'hsl(var(--accent-emerald))',          // accent emerald
  'Healthcare': 'hsl(var(--accent-pink))',            // accent pink
  'Others': 'hsl(var(--accent-cyan))'                 // accent cyan
} as const

export type CategoryType = keyof typeof categoryColors

// Get color for a category, with fallback colors for unknown categories
export function getCategoryColor(category: string): string {
  // Direct match with CategoryType
  if (category in categoryColors) {
    return categoryColors[category as CategoryType]
  }

  // Try to match by keywords for better consistency
  const normalizedCategory = category.toLowerCase()

  if (normalizedCategory.includes('food') || normalizedCategory.includes('dining')) {
    return categoryColors['Food & Dining']
  } else if (normalizedCategory.includes('transport')) {
    return categoryColors['Transportation']
  } else if (normalizedCategory.includes('bill') || normalizedCategory.includes('util')) {
    return categoryColors['Bills & Utilities']
  } else if (normalizedCategory.includes('entertain')) {
    return categoryColors['Entertainment']
  } else if (normalizedCategory.includes('shop')) {
    return categoryColors['Shopping']
  } else if (normalizedCategory.includes('health') || normalizedCategory.includes('medical')) {
    return categoryColors['Healthcare']
  } else if (normalizedCategory.includes('grocer')) {
    return categoryColors['Groceries']
  } else if (normalizedCategory.includes('other')) {
    return categoryColors['Others']
  }

  // Fallback colors using the app's accent colors
  const fallbackColors = [
    'hsl(var(--accent))',           // main accent (purple)
    'hsl(var(--accent-blue))',      // accent blue
    'hsl(var(--accent-green))',     // accent green
    'hsl(var(--accent-gold))',      // accent gold
    'hsl(var(--accent-red))',       // accent red
    'hsl(var(--accent-cyan))',      // accent cyan
  ]

  const index = Math.abs(hashString(category)) % fallbackColors.length
  return fallbackColors[index]
}

// Status colors for different states
export const statusColors = {
  danger: '#ff4444',    // Brighter Red
  warning: '#ff8c1a',   // Brighter Orange
  caution: '#ffcc00',   // Brighter Yellow
  success: '#2ecc71',   // Brighter Green
} as const

// Helper function to hash a string
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}

// Get color based on percentage value
export function getStatusColorByPercentage(percentage: number): string {
  if (percentage >= 100) return statusColors.danger
  if (percentage >= 90) return statusColors.warning
  if (percentage >= 75) return statusColors.caution
  return statusColors.success
}



