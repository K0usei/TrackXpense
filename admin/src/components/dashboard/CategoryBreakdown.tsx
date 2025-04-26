import { formatCurrency } from '@/lib/utils'
import { CategoryType } from '@/lib/colors'
import { getCategoryColorForAnyFormat } from '@/lib/category-utils'

// Define the props interface
interface CategoryBreakdownProps {
  data: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  return (
    <div className="space-y-4">
      {data.map(({ category, amount, percentage }) => (
        <div key={category} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: getCategoryColorForAnyFormat(category)
              }}
            />
            <span className="text-sm font-medium">{category}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
