import { formatCurrency } from './utils'
import { EXPENSE_CATEGORIES } from './constants'

export interface ChartDataPoint {
  date: string
  amount: number
  [key: string]: any
}

export type TimeFilter = 'daily' | 'weekly' | 'monthly'

export function generatePlaceholderData(timeFilter: TimeFilter): Record<string, any>[] {
  const data: Record<string, any>[] = []
  const today = new Date()
  const points = timeFilter === 'daily' ? 7 : timeFilter === 'weekly' ? 4 : 6

  for (let i = points - 1; i >= 0; i--) {
    const date = new Date()
    if (timeFilter === 'daily') {
      date.setDate(today.getDate() - i)
    } else if (timeFilter === 'weekly') {
      date.setDate(today.getDate() - (i * 7))
    } else {
      date.setMonth(today.getMonth() - i)
    }

    const dataPoint: Record<string, any> = {
      date: date.toISOString().split('T')[0],
    }

    // Add placeholder values for each category
    EXPENSE_CATEGORIES.forEach(category => {
      dataPoint[category] = 0
    })

    data.push(dataPoint)
  }
  return data
}

export function formatChartDate(value: string, timeFilter: TimeFilter): string {
  const date = new Date(value)
  if (timeFilter === 'monthly') {
    return date.toLocaleString('default', { month: 'short' })
  } else if (timeFilter === 'weekly') {
    return `Week ${Math.ceil(date.getDate() / 7)}`
  }
  return date.toLocaleString('default', { month: 'short', day: 'numeric' })
}

export const chartStyles = {
  axis: {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
    style: {
      fontSize: '12px',
    }
  },
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '6px',
      padding: '8px 12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  },
  grid: {
    strokeDasharray: "3 3",
    stroke: "hsl(var(--border))",
    opacity: 0.4,
    vertical: false
  }
}

