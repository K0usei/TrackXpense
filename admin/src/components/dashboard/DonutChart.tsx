'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { categoryColors, CategoryType } from '@/lib/colors'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { getCategoryColorForAnyFormat } from '@/lib/category-utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface DonutChartProps {
  data: Array<{
    category: CategoryType
    spent: number
    budget: number
    color: string
  }>
  loading?: boolean
  currency?: string
}

export function DonutChart({ data, loading = false, currency = 'PHP' }: DonutChartProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const isTablet = useMediaQuery('(max-width: 768px)')
  const isSmallScreen = useMediaQuery('(max-width: 1024px)')

  const placeholderData = EXPENSE_CATEGORIES.map(category => ({
    category,
    spent: 20,
    budget: 100,
    color: categoryColors[category as CategoryType] || '#888888'
  }))

  // Use the data directly if it's in the right format, or convert it
  const processedData = loading ? placeholderData : data.map(item => ({
    category: item.category,
    spent: item.spent || 0,
    budget: item.budget || 0,
    color: item.color || categoryColors[item.category as CategoryType] || '#888888'
  }))

  // Sort data by spent amount in descending order
  const sortedData = [...processedData].sort((a, b) => {
    return b.spent - a.spent
  })

  if (loading) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
        Loading...
      </div>
    )
  }

  // Check if there's actual spending data
  const hasData = sortedData.some(item => item.spent > 0)

  // If no data, create placeholder data with equal values for all categories
  if (!hasData) {
    // Create placeholder data with 12.5% for each category
    sortedData.forEach(item => {
      item.spent = 12.5 // Equal distribution for placeholder
    })
  }

  // Add a flag to apply muted styling for placeholder data
  const isPlaceholder = !hasData

  // Determine optimal number of columns based on screen size
  const columns = isMobile ? 2 : isTablet ? 3 : isSmallScreen ? 4 : 4

  // Calculate items per column
  const itemsPerColumn = Math.ceil(sortedData.length / columns)

  // Create legend groups
  const legendGroups = Array.from({ length: columns }, (_, i) =>
    sortedData.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
  )

  return (
    <div className="w-full flex flex-col items-center gap-2 sm:gap-4">
      <div className="w-full h-full aspect-square max-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sortedData}
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="80%"
              fill="#8884d8"
              paddingAngle={3}
              dataKey="spent"
              nameKey="category"
              cornerRadius={4}
              labelLine={false}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || getCategoryColorForAnyFormat(entry.category)}
                  opacity={isPlaceholder ? 0.4 : (entry.spent === 0 ? 0.3 : 1)}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              itemStyle={{
                color: 'hsl(var(--foreground))'
              }}
              labelStyle={{
                color: 'hsl(var(--foreground))'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 items-start w-full min-w-fit">
          {legendGroups.map((group, groupIndex) => (
            <div
              key={`legend-group-${groupIndex}`}
              className={cn(
                "flex flex-col gap-1",
                isMobile ? "min-w-[100px]" : "min-w-[120px]"
              )}
            >
              {group.map((entry, index) => (
                <div
                  key={`legend-${groupIndex}-${index}`}
                  className="flex items-center gap-1.5 overflow-hidden"
                  title={entry.category} // Add tooltip for truncated text
                >
                  <div
                    className="min-w-[8px] w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: entry.color || getCategoryColorForAnyFormat(entry.category),
                      opacity: isPlaceholder ? 0.4 : 1
                    }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {entry.category}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}















