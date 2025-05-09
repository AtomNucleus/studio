'use client';

import { useMemo } from 'react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Transaction } from '@/components/transactions/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartTooltipContent } from "@/components/ui/chart"; // Using ShadCN's tooltip
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';
import { format } from 'date-fns';

interface SpendingBarChartProps {
  transactions: Transaction[];
}

type ChartData = {
  name: string;
  spending: number;
};

export default function SpendingBarChart({ transactions }: SpendingBarChartProps) {
  const [groupBy, setGroupBy] = useState<'category' | 'month'>('category');

  const chartData = useMemo(() => {
    const spendingTransactions = transactions.filter(t => t.amount < 0); // Only expenses

    if (groupBy === 'category') {
      const spendingByCategory: { [key: string]: number } = {};
      spendingTransactions.forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(transaction.amount);
      });
      return Object.entries(spendingByCategory)
        .map(([name, spending]) => ({ name, spending: parseFloat(spending.toFixed(2)) }))
        .sort((a, b) => b.spending - a.spending) // Sort by spending descending
        .slice(0, 10); // Show top 10 categories
    } else { // groupBy 'month'
      const spendingByMonth: { [key: string]: number } = {};
      spendingTransactions.forEach(transaction => {
        const monthYear = format(new Date(transaction.date), 'yyyy-MM');
        spendingByMonth[monthYear] = (spendingByMonth[monthYear] || 0) + Math.abs(transaction.amount);
      });
      return Object.entries(spendingByMonth)
        .map(([name, spending]) => ({ name: format(new Date(name + '-01'), 'MMM yyyy') , spending: parseFloat(spending.toFixed(2)) })) // Format name for display
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Sort by month
    }
  }, [transactions, groupBy]);

  if (transactions.length === 0 || chartData.length === 0) {
    return (
      <Card className="w-full glassmorphic">
        <CardHeader>
          <CardTitle>Spending Analysis</CardTitle>
           <CardDescription>No spending data available to display.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Upload transactions to see spending patterns.</p>
        </CardContent>
      </Card>
    );
  }
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-background/80 backdrop-blur-sm border border-border rounded-md shadow-lg">
          <p className="label font-semibold">{`${label}`}</p>
          <p className="intro text-primary">{`Spending: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="w-full glassmorphic">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Spending Analysis</CardTitle>
          <CardDescription>Visualizing your expenses by {groupBy}.</CardDescription>
        </div>
        <Select value={groupBy} onValueChange={(value: 'category' | 'month') => setGroupBy(value)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="month">Month</SelectItem>
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
            <XAxis 
              dataKey="name" 
              tickLine={false} 
              axisLine={false} 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              interval={0} // Ensure all labels are shown, adjust if too crowded
              angle={groupBy === 'month' ? -35 : 0}
              textAnchor={groupBy === 'month' ? 'end' : 'middle'}
              height={groupBy === 'month' ? 60 : 30}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent)/0.2)' }}/>
            <Legend wrapperStyle={{fontSize: "12px"}}/>
            <Bar dataKey="spending" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={groupBy === 'month' ? 30 : undefined} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
