import { useState, useEffect } from 'react'
import { Expense } from '@/lib/db'
import axios from 'axios'
import { getApiUrl } from '@/lib/utils'

export function useExpenses(userId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExpenses() {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        // Use API call instead of direct Prisma access
        const response = await axios.get(`${getApiUrl()}/expenses?userId=${userId}`)
        setExpenses(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch expenses')
        console.error('Error fetching expenses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [userId])

  return { expenses, loading, error }
}
