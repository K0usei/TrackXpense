'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import {
  generatePlaceholderData,
  formatChartDate,
  chartStyles,
  type ChartDataPoint,
  type TimeFilter
} from '@/lib/chart-utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface BarGraphProps {
  data?: ChartDataPoint[]
  timeFilter?: TimeFilter
  loading?: boolean
  currency?: string
}

export function BarGraph({ data, timeFilter = 'daily', loading = false, currency = 'PHP' }: BarGraphProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 768px)')

  // Ensure isPlaceholder is true when data is empty or loading
  const isPlaceholder = loading || !data || data.length === 0
  // Generate placeholder data if needed
  const chartData = isPlaceholder ? generatePlaceholderData(timeFilter) : data

  // Define colors as constants
  const PLACEHOLDER_COLOR = "#a1a1aa"
  const ACTIVE_COLOR = "#0ea5e9"

  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <BarChart
          data={chartData}
          margin={{
            top: isMobile ? 5 : isTablet ? 10 : 20,
            right: isMobile ? 5 : isTablet ? 10 : 20,
            left: isMobile ? 0 : isTablet ? 5 : 20,
            bottom: isMobile ? 5 : isTablet ? 10 : 20
          }}
        >
          <CartesianGrid {...chartStyles.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatChartDate(value, timeFilter)}
            {...chartStyles.axis}
            axisLine={true}
            tickLine={true}
            dy={10}
            tick={{
              fontSize: isMobile ? 9 : isTablet ? 10 : 12,
              angle: isMobile ? -45 : 0,
              textAnchor: isMobile ? 'end' : 'middle',
              dy: isMobile ? 10 : 0
            }}
            interval={isMobile ? 1 : 0}
            height={isMobile ? 60 : 40}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency)}
            {...chartStyles.axis}
            axisLine={true}
            tickLine={true}
            dx={-5}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            width={isMobile ? 60 : 70}
            // Ensure the Y-axis is always visible
            hide={false}
            // Add domain to ensure y-axis starts at 0
            domain={[0, 'auto']}
            // Add allowDecimals={false} to avoid decimal values
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, currency), 'Amount']}
            labelFormatter={(label) => formatChartDate(label as string, timeFilter)}
            {...chartStyles.tooltip}
            cursor={{ fill: 'rgba(14, 165, 233, 0.1)' }}
            contentStyle={{
              ...chartStyles.tooltip.contentStyle,
              fontSize: isMobile ? '10px' : '12px',
              padding: isMobile ? '4px 8px' : '8px 12px'
            }}
          />
          <Bar
            dataKey="amount"
            fill={isPlaceholder ? PLACEHOLDER_COLOR : ACTIVE_COLOR}
            radius={[4, 4, 0, 0]}
            style={{
              opacity: isPlaceholder ? 0.5 : 1,
            }}
            maxBarSize={isMobile ? 30 : isTablet ? 40 : 50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}





