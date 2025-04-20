import { useState, useEffect } from 'react'

interface Transaction {
    id: number
    date: string
    merchant: string
    category: string
    amount: number
    status: string
}

interface FinancialData {
    balance: number
    monthlyExpenses: number
    monthlyIncome: number
    savingsRate: number
    transactions: Transaction[]
    loading: boolean
    error: string | null
}

export function useFinancialData() {
    const [data, setData] = useState<FinancialData>({
        balance: 0,
        monthlyExpenses: 0,
        monthlyIncome: 0,
        savingsRate: 0,
        transactions: [],
        loading: true,
        error: null
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                // In a real app, this would be an API call
                // For now, we'll use mock data
                const response = await mockFetchData()
                setData({
                    ...response,
                    loading: false,
                    error: null
                })
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch financial data'
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: errorMessage
                }))
            }
        }

        fetchData()
    }, [])

    return data
}

// Mock API call
async function mockFetchData(): Promise<Omit<FinancialData, 'loading' | 'error'>> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                balance: 2450.25,
                monthlyExpenses: 1250.00,
                monthlyIncome: 3750.00,
                savingsRate: 25,
                transactions: [
                    {
                        id: 1,
                        date: '2024-02-20',
                        merchant: 'Walmart',
                        category: 'Shopping',
                        amount: -125.65,
                        status: 'completed'
                    },
                    {
                        id: 2,
                        date: '2024-02-19',
                        merchant: 'Netflix',
                        category: 'Entertainment',
                        amount: -15.99,
                        status: 'completed'
                    },
                    {
                        id: 3,
                        date: '2024-02-18',
                        merchant: 'Shell Gas Station',
                        category: 'Transportation',
                        amount: -45.50,
                        status: 'completed'
                    },
                    {
                        id: 4,
                        date: '2024-02-15',
                        merchant: 'Whole Foods',
                        category: 'Groceries',
                        amount: -89.75,
                        status: 'completed'
                    },
                    {
                        id: 5,
                        date: '2024-02-15',
                        merchant: 'Employer Inc',
                        category: 'Income',
                        amount: 1875.00,
                        status: 'completed'
                    },
                    {
                        id: 6,
                        date: '2024-02-14',
                        merchant: 'Starbucks',
                        category: 'Dining',
                        amount: -5.75,
                        status: 'completed'
                    },
                    {
                        id: 7,
                        date: '2024-02-13',
                        merchant: 'AT&T',
                        category: 'Bills & Utilities',
                        amount: -85.00,
                        status: 'completed'
                    },
                    {
                        id: 8,
                        date: '2024-02-12',
                        merchant: 'Amazon',
                        category: 'Shopping',
                        amount: -67.99,
                        status: 'completed'
                    }
                ]
            })
        }, 1000)
    })
}

