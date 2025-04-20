'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { categoryColors, CategoryType } from '@/lib/colors'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const data = [
    { name: 'Food & Dining', value: 400 },
    { name: 'Transportation', value: 300 },
    { name: 'Shopping', value: 300 },
    { name: 'Bills & Utilities', value: 200 },
    { name: 'Entertainment', value: 150 }
]

const COLORS = Object.values(categoryColors)

export function ExpenseChart() {
    const isMobile = useMediaQuery('(max-width: 640px)')
    const isTablet = useMediaQuery('(max-width: 768px)')

    return (
        <div className="w-full h-full aspect-square max-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="35%"
                        outerRadius="70%"
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={categoryColors[entry.name as CategoryType] || COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: isMobile ? '12px' : '14px'
                        }}
                    />
                    <Legend
                        layout={isMobile ? "horizontal" : "horizontal"}
                        verticalAlign={"bottom"}
                        align={"center"}
                        wrapperStyle={{
                            fontSize: isMobile ? '10px' : '12px',
                            paddingTop: '10px',
                            width: '100%',
                            overflowX: 'auto',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}

