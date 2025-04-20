'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { ReceiptScanner } from '../scanner/receipt-scanner'
import type { ReceiptData } from '@/lib/services/ocr-service'
import { CategoryPredictor } from '@/lib/services/category-predictor'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

export type TransactionCategory = typeof EXPENSE_CATEGORIES[number]

interface TransactionFormData {
    description: string
    amount: number
    category: TransactionCategory
    date: string
    type: 'expense' | 'income'
}

export function TransactionForm() {
    const [loading, setLoading] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [formData, setFormData] = useState<TransactionFormData>({
        description: '',
        amount: 0,
        category: EXPENSE_CATEGORIES[0],
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
    })

    const handleScanComplete = async (receiptData: ReceiptData) => {
        const prediction = await CategoryPredictor.predictCategory(
            receiptData.vendor,
            receiptData.total,
            receiptData.vendor
        )

        setFormData({
            description: receiptData.vendor,
            amount: receiptData.total,
            category: (prediction.category as TransactionCategory) || EXPENSE_CATEGORIES[0],
            date: receiptData.date,
            type: 'expense'
        })
        setShowScanner(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // Add your API call here
            await new Promise(resolve => setTimeout(resolve, 1000))
            setFormData({
                description: '',
                amount: 0,
                category: EXPENSE_CATEGORIES[0],
                date: new Date().toISOString().split('T')[0],
                type: 'expense'
            })
        } catch (error) {
            console.error('Error submitting transaction:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Button
                variant="outline"
                onClick={() => setShowScanner(!showScanner)}
                className="w-full"
            >
                {showScanner ? 'Hide Scanner' : 'Scan Receipt'}
            </Button>

            {showScanner && (
                <ReceiptScanner onScanComplete={handleScanComplete} />
            )}

            <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Input
                            value={formData.description}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount</label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.amount}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select
                            value={formData.category}
                            onValueChange={(value: TransactionCategory) => setFormData({ ...formData, category: value })}
                        >
                            {EXPENSE_CATEGORIES.map((category: TransactionCategory) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select
                            value={formData.type}
                            onValueChange={(value: 'expense' | 'income') =>
                                setFormData({ ...formData, type: value })}
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                        </Select>
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Adding...' : 'Add Transaction'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}


