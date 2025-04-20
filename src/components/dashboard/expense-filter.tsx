"use client"

import { Button } from "@/components/ui/button"

interface ExpenseFilterProps {
  timeframe: 'daily' | 'weekly' | 'monthly'
  setTimeframe: (value: 'daily' | 'weekly' | 'monthly') => void
}

export function ExpenseFilter({ timeframe, setTimeframe }: ExpenseFilterProps) {
  const handleTimeframeClick = (value: 'daily' | 'weekly' | 'monthly') => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTimeframe(value)
  }

  return (
    <div className="inline-flex rounded-full border bg-background/50 backdrop-blur-sm p-1 shadow-lg overflow-hidden">
      <Button
        variant={timeframe === 'daily' ? 'default' : 'ghost'}
        size="sm"
        className={`relative h-8 px-3 sm:px-6 md:px-8 text-xs sm:text-sm font-medium rounded-l-full ${timeframe === 'daily'
          ? 'bg-blue-600/85 text-white hover:bg-blue-500/85'
          : ''
          }`}
        onClick={handleTimeframeClick('daily')}
      >
        Daily
      </Button>
      <Button
        variant={timeframe === 'weekly' ? 'default' : 'ghost'}
        size="sm"
        className={`relative h-8 px-3 sm:px-6 md:px-8 text-xs sm:text-sm font-medium rounded-none ${timeframe === 'weekly'
          ? 'bg-blue-600/85 text-white hover:bg-blue-500/85'
          : ''
          }`}
        onClick={handleTimeframeClick('weekly')}
      >
        Weekly
      </Button>
      <Button
        variant={timeframe === 'monthly' ? 'default' : 'ghost'}
        size="sm"
        className={`relative h-8 px-3 sm:px-6 md:px-8 text-xs sm:text-sm font-medium rounded-r-full ${timeframe === 'monthly'
          ? 'bg-blue-600/85 text-white hover:bg-blue-500/85'
          : ''
          }`}
        onClick={handleTimeframeClick('monthly')}
      >
        Monthly
      </Button>
    </div>
  )
}















