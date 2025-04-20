"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { formatCurrency } from '../../lib/utils'
import { CategoryType } from '@/lib/colors'
import { getCategoryColorForAnyFormat } from '@/lib/category-utils'

interface CategoryDistributionProps {
  data: Array<{
    name: string
    value: number
  }>
}

export function CategoryDistribution({ data }: CategoryDistributionProps) {
  // Sort data by value in descending order
  const sortedData = [...data].sort((a, b) => b.value - a.value)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={sortedData}
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {sortedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getCategoryColorForAnyFormat(entry.name)}
            />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

