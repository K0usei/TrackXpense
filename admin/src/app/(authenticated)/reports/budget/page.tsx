"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ExpenseFilter } from "@/components/dashboard/expense-filter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBudgetData } from "@/hooks/useBudgetData"
import { formatCurrency } from "@/lib/utils"
import { ErrorBoundary } from "@/components/error-boundary"

import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { TimeFilter } from '@/lib/chart-utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import {
  Receipt,
  Utensils,
  Car,
  Building2,
  ShoppingBag,
  Popcorn,
  Heart,
  Wallet,
  HelpCircle
} from 'lucide-react'
import { categoryColors, CategoryType } from '@/lib/colors'

// Category icon mapping
const categoryIcons = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Bills & Utilities': Building2,
  'Groceries': ShoppingBag,
  'Entertainment': Popcorn,
  'Healthcare': Heart,
  'Shopping': ShoppingBag,
  'Others': HelpCircle
} as const

export default function BudgetReportPage() {
  const [timeframe, setTimeframe] = useState<TimeFilter>('monthly')
  const { totalBudget: income, totalSpent: expenses, categories, loading, error, currency } = useBudgetData(timeframe)

  // Track previous values to highlight changes
  const [prevIncome, setPrevIncome] = useState<number | null>(null)
  const [prevExpenses, setPrevExpenses] = useState<number | null>(null)
  const [incomeChanged, setIncomeChanged] = useState(false)
  const [expensesChanged, setExpensesChanged] = useState(false)

  // Update the previous values when data changes
  useEffect(() => {
    if (!loading) {
      if (prevIncome !== null && prevIncome !== income) {
        setIncomeChanged(true)
        // Reset the highlight after a short delay
        setTimeout(() => setIncomeChanged(false), 2000)
      }
      if (prevExpenses !== null && prevExpenses !== expenses) {
        setExpensesChanged(true)
        // Reset the highlight after a short delay
        setTimeout(() => setExpensesChanged(false), 2000)
      }
      setPrevIncome(income)
      setPrevExpenses(expenses)
    }
  }, [income, expenses, loading, prevIncome, prevExpenses])

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-4">
        <AlertDescription>
          {error}. Please try again later or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    )
  }

  // Prepare chart data from the categories returned by the hook
  const chartData = loading ?
    // Use placeholder data while loading
    EXPENSE_CATEGORIES.map(category => ({
      name: category,
      budget: 0,
      spent: 0
    })) :
    // Use actual data from the hook
    categories.map(category => ({
      name: category.name,
      budget: category.budget,
      spent: category.spent
    }))

  // Calculate budget utilization percentage based on the budget
  // For daily and weekly views, we need to adjust the calculation
  let adjustedExpenses = expenses
  if (timeframe === 'daily') {
    // Estimate full month expenses based on daily data
    adjustedExpenses = expenses * 30
  } else if (timeframe === 'weekly') {
    // Estimate full month expenses based on weekly data
    adjustedExpenses = expenses * 4
  }

  // Calculate utilization using the adjusted expenses against the budget
  const budgetUtilization = income > 0 ? (adjustedExpenses / income) * 100 : 0

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4 pb-0 lg:pb-8">
        <div className="flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Budget Report</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-violet-500/30 to-violet-500/5 hover:from-violet-500/40 hover:to-violet-500/10 backdrop-blur-sm border-0">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Budget
                  </p>
                  <div className="inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    Monthly
                  </div>
                </div>
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
              </div>
              {loading ? (
                <p className="text-lg sm:text-2xl font-semibold truncate">...</p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`budget-${timeframe}-${income}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className={`text-lg sm:text-2xl font-semibold truncate ${incomeChanged ? 'text-violet-500' : ''}`}
                  >
                    {formatCurrency(income, currency)}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-cyan-500/30 to-cyan-500/5 hover:from-cyan-500/40 hover:to-cyan-500/10 backdrop-blur-sm border-0">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Expenses
                  </p>
                  <div className="inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
                  </div>
                </div>
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-500" />
              </div>
              {loading ? (
                <p className="text-lg sm:text-2xl font-semibold truncate">...</p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`expenses-${timeframe}-${expenses}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className={`text-lg sm:text-2xl font-semibold truncate ${expensesChanged ? 'text-cyan-500' : ''}`}
                  >
                    {formatCurrency(expenses, currency)}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>
          </Card>
        </div>

        {/* Budget Utilization */}
        <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-blue-500/30 to-blue-500/5 hover:from-blue-500/40 hover:to-blue-500/10 backdrop-blur-sm border-0">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-medium">Budget Utilization</h3>
                <div className="inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`utilization-${timeframe}-${Math.round(budgetUtilization)}`}
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-medium"
                >
                  {loading ? "..." : `${Math.round(budgetUtilization)}%`}
                </motion.p>
              </AnimatePresence>
            </div>
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%' }}
            >
              <Progress
                value={budgetUtilization}
                className="h-2"
                indicatorClassName={
                  budgetUtilization > 100 ? "bg-red-500" :
                    budgetUtilization > 80 ? "bg-yellow-500" :
                      "bg-green-500"
                }
              />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.p
                key={`utilization-desc-${timeframe}-${Math.round(budgetUtilization)}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-xs text-muted-foreground"
              >
                {budgetUtilization > 100 ?
                  `Based on your ${timeframe} spending, you're projected to use ${Math.round(budgetUtilization)}% of your budget.` :
                  budgetUtilization > 80 ?
                    `You're using ${Math.round(budgetUtilization)}% of your budget based on current ${timeframe} spending.` :
                    `You've used ${Math.round(budgetUtilization)}% of your budget so far.`
                }
              </motion.p>
            </AnimatePresence>
          </div>
        </Card>

        {/* Timeframe Filter */}
        <div className="flex justify-center">
          <ExpenseFilter timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>

        {/* Budget Overview Chart */}
        <Card className="p-4 sm:p-6 relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-teal-500/30 to-teal-500/5 hover:from-teal-500/40 hover:to-teal-500/10 backdrop-blur-sm border-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-medium">Budget Overview</h3>
              <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
              </div>
            </div>
            <div className="w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]" style={{
              height: `${Math.max(Math.min(chartData.length * 45, 500), 300)}px`,
            }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[...chartData].sort((a, b) => b.spent - a.spent)}
                  margin={{ top: 20, right: 20, left: 35, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.4}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => formatCurrency(value, currency)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#71717a', fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value, currency), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{
                      paddingBottom: '20px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                    formatter={(value) => (
                      <span className="text-foreground">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="budget"
                    name="Budget"
                    radius={[0, 4, 4, 0]}
                    barSize={30}
                    fill="hsl(var(--accent-blue) / 0.7)"  // accent blue with opacity
                  />
                  <Bar
                    dataKey="spent"
                    name="Spent"
                    radius={[0, 4, 4, 0]}
                    barSize={30}
                    fill="hsl(var(--accent-cyan) / 0.7)"  // accent cyan with opacity
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Category Breakdown</h3>
            <div className="inline-flex items-center px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
              {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
            </div>
          </div>
          <div className="space-y-3">
            {/* Sort categories by spent amount in descending order */}
            {[...chartData]
              .sort((a, b) => b.spent - a.spent)
              .map((category) => {
                const categoryKey = category.name as CategoryType;
                const IconComponent = categoryIcons[categoryKey] || HelpCircle;
                const color = categoryColors[categoryKey] || categoryColors.Others;

                return (
                  <div
                    key={category.name}
                    className="p-4 rounded-xl transition-all duration-300 backdrop-blur-sm border-0 hover:shadow-md"
                    style={{
                      background: `linear-gradient(to right bottom, ${color}30, ${color}10)`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
                        <span className="text-sm sm:text-base font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium">
                          {formatCurrency(category.spent, currency)}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          /{formatCurrency(category.budget, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  )
}








