'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import {
  generatePlaceholderData,
  formatChartDate,
  chartStyles,
  type TimeFilter
} from '@/lib/chart-utils'
// Import necessary utilities
import { getCategoryColorForAnyFormat } from '@/lib/category-utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface ActivityReportProps {
  data?: Array<Record<string, any>>
  timeFilter: TimeFilter
  loading?: boolean
  currency?: string
}

export function ActivityReport({ data, timeFilter, loading = false, currency = 'PHP' }: ActivityReportProps) {
  const isPlaceholder = loading || !data || data.length === 0

  // Generate placeholder data for each category if needed
  const chartData = isPlaceholder ? generatePlaceholderData(timeFilter) : data

  // Get all categories that have data
  const categories = isPlaceholder
    ? EXPENSE_CATEGORIES
    : Object.keys(chartData.reduce((acc: Record<string, boolean>, dataPoint: Record<string, any>) => {
      Object.keys(dataPoint).forEach(key => {
        if (key !== 'date' && typeof dataPoint[key] === 'number') {
          acc[key] = true
        }
      })
      return acc
    }, {}))

  return (
    <div className="w-full h-full min-h-[250px] sm:min-h-[300px] lg:min-h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20
          }}
        >
          <CartesianGrid {...chartStyles.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatChartDate(value, timeFilter)}
            {...chartStyles.axis}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency)}
            {...chartStyles.axis}
            axisLine={true}
            tickLine={true}
            dx={-10}
            width={60}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, currency), 'Amount']}
            labelFormatter={(label) => formatChartDate(label as string, timeFilter)}
            {...chartStyles.tooltip}
          />
          {/* Create a line for each category */}
          {categories.map((category) => {
            const color = getCategoryColorForAnyFormat(category)
            return (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                name={category}
                stroke={isPlaceholder ? "#a1a1aa" : color}
                strokeWidth={2}
                dot={{
                  fill: isPlaceholder ? "#a1a1aa" : color,
                  stroke: isPlaceholder ? "#a1a1aa" : color,
                  r: 3
                }}
                style={{
                  opacity: isPlaceholder ? 0.5 : 1,
                }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ActivityReport





