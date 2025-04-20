import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ReportData {
  activities: Array<{
    date: string
    [key: string]: any
  }>
}

export function useReportData(timeFilter: string) {
  const [spendingData, setSpendingData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/reports/activity?period=${timeFilter}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view this data')
            return
          }
          throw new Error('Failed to fetch report data')
        }

        const data = await response.json()
        setSpendingData(data.activities || [])
        setError(null)
      } catch (err) {
        setError('Failed to fetch report data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeFilter, user])

  return { spendingData, loading, error }
}

