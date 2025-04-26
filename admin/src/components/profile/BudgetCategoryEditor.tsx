import { type ChangeEvent } from 'react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/constants'

interface BudgetCategoryEditorProps {
  categories: Record<string, number>
  onUpdate: (categories: Record<string, number>) => void
  currency: string
}

export function BudgetCategoryEditor({
  categories,
  onUpdate,
  currency
}: BudgetCategoryEditorProps) {
  const [newCategory, setNewCategory] = useState<ExpenseCategory | null>(EXPENSE_CATEGORIES[0])
  const [newAmount, setNewAmount] = useState('')

  const handleAddCategory = () => {
    if (!newCategory || !newAmount) return

    onUpdate({
      ...categories,
      [newCategory.toLowerCase().replace(/ & /g, '_')]: Number(newAmount)
    })

    setNewCategory(null)
    setNewAmount('')
  }

  const handleRemoveCategory = (category: string) => {
    const updatedCategories = { ...categories }
    delete updatedCategories[category]
    onUpdate(updatedCategories)
  }

  const handleUpdateAmount = (category: string, amount: string) => {
    onUpdate({
      ...categories,
      [category]: Number(amount)
    })
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {Object.entries(categories).map(([category, amount]) => (
          <div key={category} className="flex items-center gap-2">
            <Label className="w-32 text-sm">{category}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAmount(category, e.target.value)}
              className="flex-1 h-8"
              min="0"
              step="0.01"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveCategory(category)}
              className="text-destructive h-8 px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 pt-1">
        <div className="flex-1">
          <Label className="text-sm">New Category</Label>
          <Select
            value={newCategory ?? ''}
            onValueChange={(value) => setNewCategory(value as ExpenseCategory)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label className="text-sm">Amount ({currency})</Label>
          <Input
            type="number"
            value={newAmount}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewAmount(e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="h-8"
          />
        </div>
        <Button onClick={handleAddCategory} size="sm" className="h-8 px-2">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}




