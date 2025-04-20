'use client'
/// <reference types="react" />

const transactions = [
    {
        id: 1,
        description: "Grocery Shopping",
        amount: -82.55,
        date: "2024-03-15",
        category: "Food & Dining"
    },
    {
        id: 2,
        description: "Monthly Salary",
        amount: 3500.00,
        date: "2024-03-01",
        category: "Income"
    },
    {
        id: 3,
        description: "Electric Bill",
        amount: -125.40,
        date: "2024-03-10",
        category: "Utilities"
    },
    {
        id: 4,
        description: "Coffee Shop",
        amount: -4.50,
        date: "2024-03-14",
        category: "Food & Dining"
    }
]

export function RecentTransactions() {
    return (
        <div className="space-y-4">
            {transactions.map((transaction) => (
                <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                    <div className="space-y-1">
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                            {transaction.category} • {transaction.date}
                        </p>
                    </div>
                    <p className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {transaction.amount > 0 ? '+' : ''}
                        ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                </div>
            ))}
        </div>
    )
}
