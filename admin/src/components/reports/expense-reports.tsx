'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ActivityReport from './activity-report'
import BudgetReport from './budget-report'

type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function ExpenseReports() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly')

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Expense Reports</h2>
        <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <ActivityReport timeFilter={timeFilter} />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetReport timeFilter={timeFilter} />
        </TabsContent>
      </Tabs>
    </Card>
  )
}