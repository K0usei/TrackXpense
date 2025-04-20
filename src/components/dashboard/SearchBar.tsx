'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface SearchBarProps {
    onSearch: (filters: SearchFilters) => void
}

interface SearchFilters {
    query: string
    category: string
    dateRange: string
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        query: '',
        category: 'all',
        dateRange: 'all'
    })

    const handleReset = () => {
        setFilters({
            query: '',
            category: 'all',
            dateRange: 'all'
        })
        onSearch({
            query: '',
            category: 'all',
            dateRange: 'all'
        })
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search transactions..."
                    value={filters.query}
                    onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                    className="pl-9"
                />
            </div>

            <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
                <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem
                            key={category}
                            value={category.toLowerCase().replace(/ & /g, '-')}
                        >
                            {category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
            >
                <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex gap-2">
                <Button
                    variant="secondary"
                    onClick={() => onSearch(filters)}
                >
                    Search
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}



