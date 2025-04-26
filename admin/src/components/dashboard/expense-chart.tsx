"use client"

import { Card } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface ExpenseData {
  date: string
  amount: number
}

interface ExpenseChartProps {
  data: ExpenseData[]
  loading?: boolean
}

export function ExpenseChart({ data, loading = false }: ExpenseChartProps) {
  if (loading) {
    return (
      <Card className="p-4 h-[400px] flex items-center justify-center">
        <div>Loading...</div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            stroke="#71717a"
            tick={{ fill: '#71717a' }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            stroke="#71717a"
            tick={{ fill: '#71717a' }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => `Date: ${label}`}
            contentStyle={{ backgroundColor: '#f4f4f5', border: '1px solid #e4e4e7' }}
          />
          <Bar dataKey="amount" fill="#a1a1aa" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
