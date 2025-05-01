import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletCards, PiggyBank, PieChart, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface DashboardStatsProps {
    totalExpenses: number
    monthlyBudget: number
    remainingBalance: number
    loading?: boolean
    currency?: string
    timeframe?: 'daily' | 'weekly' | 'monthly'
}

export function DashboardStats({
    totalExpenses,
    monthlyBudget,
    remainingBalance,
    loading,
    currency = 'PHP',
    timeframe = 'daily'
}: DashboardStatsProps) {
    // Track previous values to highlight changes
    const [prevExpenses, setPrevExpenses] = useState<number | null>(null)
    const [prevRemaining, setPrevRemaining] = useState<number | null>(null)
    const [expensesChanged, setExpensesChanged] = useState(false)
    const [remainingChanged, setRemainingChanged] = useState(false)

    // Update the previous values when data changes
    useEffect(() => {
        if (!loading) {
            if (prevExpenses !== null && prevExpenses !== totalExpenses) {
                setExpensesChanged(true)
                // Reset the highlight after a short delay
                setTimeout(() => setExpensesChanged(false), 2000)
            }
            if (prevRemaining !== null && prevRemaining !== remainingBalance) {
                setRemainingChanged(true)
                // Reset the highlight after a short delay
                setTimeout(() => setRemainingChanged(false), 2000)
            }
            setPrevExpenses(totalExpenses)
            setPrevRemaining(remainingBalance)
        }
    }, [totalExpenses, remainingBalance, loading, prevExpenses, prevRemaining])
    // Calculate budget usage percentage - avoid division by zero
    const budgetUsagePercentage = monthlyBudget ? (totalExpenses / monthlyBudget) * 100 : 0

    // Calculate if user is overspending (negative percentage means under budget)
    const expensePercentage = monthlyBudget ? ((monthlyBudget - totalExpenses) / monthlyBudget) * 100 : 0
    const isOverspending = expensePercentage < 0

    // Check if there are any expenses at all
    const hasExpenses = totalExpenses > 0

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return 'from-red-500/40 to-red-500/10'
        if (percentage >= 75) return 'from-yellow-500/40 to-yellow-500/10'
        return 'from-green-500/40 to-green-500/10'
    }

    const cardGradients = {
        budget: 'bg-gradient-to-br from-violet-500/40 to-violet-500/10 hover:from-violet-500/50 hover:to-violet-500/20',
        expenses: 'bg-gradient-to-br from-cyan-500/40 to-cyan-500/10 hover:from-cyan-500/50 hover:to-cyan-500/20',
        remaining: 'bg-gradient-to-br from-teal-500/40 to-teal-500/10 hover:from-teal-500/50 hover:to-teal-500/20',
        usage: 'bg-gradient-to-br from-lime-500/40 to-lime-500/10 hover:from-lime-500/50 hover:to-lime-500/20'
    }

    function getBalanceColor(remainingBalance: number) {
        if (remainingBalance <= 0) return 'text-red-500';
        if (remainingBalance <= monthlyBudget * 0.1) return 'text-yellow-500';
        return 'text-green-500';
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.budget} backdrop-blur-sm border-0`}>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Budget
                            </p>
                            <div className="inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                Monthly
                            </div>
                        </div>
                        <WalletCards className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={`budget-${monthlyBudget}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className="text-lg sm:text-2xl font-semibold truncate text-foreground"
                            >
                                {formatCurrency(monthlyBudget, currency)}
                            </motion.p>
                        </AnimatePresence>
                    )}
                </div>
            </Card>

            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.expenses} backdrop-blur-sm border-0`}>
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
                        <PieChart
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${getStatusColor(budgetUsagePercentage)}`}
                        />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={`expenses-${timeframe}-${totalExpenses}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className={`text-lg sm:text-2xl font-semibold truncate ${expensesChanged ? 'text-cyan-500' : ''}`}
                            >
                                {formatCurrency(totalExpenses, currency)}
                            </motion.p>
                        </AnimatePresence>
                    )}
                </div>
            </Card>

            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.remaining} backdrop-blur-sm border-0`}>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Expense Usage
                            </p>
                            <div className="inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                                {timeframe === 'daily' ? 'Today' : timeframe === 'weekly' ? 'This Week' : 'This Month'}
                            </div>
                        </div>
                        <TrendingUp
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${getStatusColor(budgetUsagePercentage)}`}
                        />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={`usage-${timeframe}-${expensePercentage.toFixed(1)}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className={`text-lg sm:text-2xl font-semibold truncate ${hasExpenses ? (isOverspending ? 'text-red-500' : 'text-green-500') : 'text-muted-foreground'}`}
                            >
                                {hasExpenses ? `${isOverspending ? '-' : '+'}${Math.abs(expensePercentage).toFixed(1)}%` : '0%'}
                            </motion.p>
                        </AnimatePresence>
                    )}
                </div>
            </Card>

            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.usage} backdrop-blur-sm border-0`}>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                                Remaining Balance
                            </p>
                            <div className="inline-flex items-center mt-0.5 px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-lime-500/10 text-lime-600 dark:text-lime-400 border border-lime-500/20">
                                Monthly
                            </div>
                        </div>
                        <PiggyBank
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${getBalanceColor(remainingBalance)}`}
                        />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={`remaining-${timeframe}-${remainingBalance}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.3 }}
                                className={`text-lg sm:text-2xl font-semibold truncate ${remainingChanged ? getBalanceColor(remainingBalance) : ''}`}
                            >
                                {formatCurrency(remainingBalance, currency)}
                            </motion.p>
                        </AnimatePresence>
                    )}
                </div>
            </Card>
        </div>
    )
}







