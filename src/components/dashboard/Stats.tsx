import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { WalletCards, PiggyBank, PieChart, TrendingUp } from "lucide-react"

interface DashboardStatsProps {
    totalExpenses: number
    monthlyBudget: number
    remainingBalance: number
    loading?: boolean
    currency?: string
}

export function DashboardStats({
    totalExpenses,
    monthlyBudget,
    remainingBalance,
    loading,
    currency = 'PHP'
}: DashboardStatsProps) {
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
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Monthly Budget
                        </p>
                        <WalletCards className="h-4 w-4 sm:h-5 sm:w-5 text-violet-500" />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <p className="text-lg sm:text-2xl font-semibold truncate text-foreground">
                            {formatCurrency(monthlyBudget, currency)}
                        </p>
                    )}
                </div>
            </Card>

            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.expenses} backdrop-blur-sm border-0`}>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Total Expenses
                        </p>
                        <PieChart
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${getStatusColor(budgetUsagePercentage)}`}
                        />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <p className="text-lg sm:text-2xl font-semibold truncate">
                            {formatCurrency(totalExpenses, currency)}
                        </p>
                    )}
                </div>
            </Card>

            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.remaining} backdrop-blur-sm border-0`}>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Expense Usage
                        </p>
                        <TrendingUp
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${getStatusColor(budgetUsagePercentage)}`}
                        />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <p className={`text-lg sm:text-2xl font-semibold truncate ${hasExpenses ? (isOverspending ? 'text-red-500' : 'text-green-500') : 'text-muted-foreground'}`}>
                            {hasExpenses ? `${isOverspending ? '-' : '+'}${Math.abs(expensePercentage).toFixed(1)}%` : '0%'}
                        </p>
                    )}
                </div>
            </Card>

            <Card className={`p-4 sm:p-6 relative overflow-hidden transition-all duration-300 ${cardGradients.usage} backdrop-blur-sm border-0`}>
                <div className="flex flex-col gap-1 sm:gap-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                            Remaining Balance
                        </p>
                        <PiggyBank
                            className={`h-4 w-4 sm:h-5 sm:w-5 ${getBalanceColor(remainingBalance)}`}
                        />
                    </div>
                    {loading ? (
                        <Skeleton className="h-6 sm:h-7 w-20 sm:w-24" />
                    ) : (
                        <p className="text-lg sm:text-2xl font-semibold truncate">
                            {formatCurrency(remainingBalance, currency)}
                        </p>
                    )}
                </div>
            </Card>
        </div>
    )
}







