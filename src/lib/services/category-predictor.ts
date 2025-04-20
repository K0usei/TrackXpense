import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/constants'

interface PredictionResult {
  category: ExpenseCategory
  confidence: number
}

export class CategoryPredictor {
  private static readonly API_URL = process.env.NEXT_PUBLIC_ML_API_URL || 'https://localhost:8000/api'

  static async predictCategory(
    description: string,
    amount: number,
    vendor: string
  ): Promise<PredictionResult> {
    try {
      // Try to use the API if available
      if (this.API_URL) {
        try {
          const response = await fetch(`${this.API_URL}/predict-category`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              description,
              amount,
              vendor,
            }),
          })

          if (response.ok) {
            return await response.json()
          }
        } catch (apiError) {
          console.warn('API prediction failed, falling back to rule-based:', apiError)
        }
      }

      // Fall back to rule-based prediction
      return this.predictCategoryRuleBased(description, amount, vendor)
    } catch (error) {
      console.error('Error predicting category:', error)
      return {
        category: 'Others',
        confidence: 0
      }
    }
  }

  // Simple rule-based category prediction as fallback
  private static predictCategoryRuleBased(
    description: string,
    amount: number,
    vendor: string
  ): PredictionResult {
    const text = `${vendor} ${description}`.toLowerCase()

    // Define category keywords
    const categoryKeywords: Record<ExpenseCategory, string[]> = {
      'Food & Dining': ['restaurant', 'cafe', 'coffee', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'pizza', 'burger', 'sushi'],
      'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'car', 'bus', 'train', 'transit', 'transport', 'parking'],
      'Bills & Utilities': ['bill', 'utility', 'electric', 'water', 'gas', 'internet', 'phone', 'cable', 'subscription'],
      'Groceries': ['grocery', 'supermarket', 'market', 'food', 'produce', 'meat', 'dairy', 'bakery'],
      'Entertainment': ['movie', 'theater', 'cinema', 'concert', 'show', 'game', 'ticket', 'netflix', 'spotify'],
      'Healthcare': ['doctor', 'medical', 'health', 'dental', 'pharmacy', 'prescription', 'hospital', 'clinic'],
      'Shopping': ['clothing', 'apparel', 'shoes', 'electronics', 'furniture', 'retail', 'store', 'mall', 'amazon'],
      'Others': []
    }

    // Check each category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return {
            category: category as ExpenseCategory,
            confidence: 0.8
          }
        }
      }
    }

    // Default to Others
    return {
      category: 'Others',
      confidence: 0.5
    }
  }
}
