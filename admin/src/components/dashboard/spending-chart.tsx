"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { CategoryType } from '@/lib/colors'
import { getCategoryColorForAnyFormat } from '@/lib/category-utils'

// Define types at the top
type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

interface SpendingDataPoint {
  name: string
  date: string
  [key: string]: any
}

interface SpendingChartProps {
  data?: SpendingDataPoint[]
  loading?: boolean
}

export function SpendingChart({ data, loading = false }: SpendingChartProps) {
  const isPlaceholder = loading || !data || data.length === 0

  const placeholderData = isPlaceholder ? Array.from({ length: 7 }).map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))

    return {
      name: date.toLocaleDateString(),
      date: date.toISOString(),
      ...Object.fromEntries(EXPENSE_CATEGORIES.map(category => [category, 0]))
    }
  }) : []

  const chartData = isPlaceholder ? placeholderData : data

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.4}
        />
        <XAxis
          dataKey="name"
          style={{ fontSize: '12px' }}
          tickLine={false}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value)}
          style={{ fontSize: '12px' }}
          tickLine={false}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            padding: '8px'
          }}
        />
        <Legend />
        {EXPENSE_CATEGORIES.map((category) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            name={category}
            stroke={getCategoryColorForAnyFormat(category)}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: getCategoryColorForAnyFormat(category),
              stroke: getCategoryColorForAnyFormat(category)
            }}
            style={{
              opacity: isPlaceholder ? 0.5 : 1,
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}



