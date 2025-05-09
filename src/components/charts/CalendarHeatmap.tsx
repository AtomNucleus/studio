'use client';

import { useMemo, useState, useEffect } from 'react';
import { format, startOfWeek, addDays, eachDayOfInterval, getMonth, getYear, isSameDay, subMonths, getISODay } from 'date-fns';
import type { Transaction } from '@/components/transactions/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CalendarHeatmapProps {
  transactions: Transaction[];
}

// Number of months to display. E.g., 6 months.
const MONTHS_TO_DISPLAY = 6;
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarHeatmap({ transactions }: CalendarHeatmapProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date()); // Ensure this runs client-side only
  }, []);

  const dailySpending = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(transaction => {
      if (transaction.amount < 0) { // Only count expenses for heatmap intensity
        const dayKey = format(new Date(transaction.date), 'yyyy-MM-dd');
        map.set(dayKey, (map.get(dayKey) || 0) + Math.abs(transaction.amount));
      }
    });
    return map;
  }, [transactions]);

  const { days, monthLabels } = useMemo(() => {
    if (!currentDate) return { days: [], monthLabels: [] };

    const endDate = currentDate;
    const startDate = subMonths(currentDate, MONTHS_TO_DISPLAY -1); // Go back X months
    
    const allDays = eachDayOfInterval({ 
      start: startOfWeek(new Date(getYear(startDate), getMonth(startDate), 1)), // Start from beginning of the week of the first day of the start month
      end: endDate 
    });
    
    const currentMonthLabels: { name: string, weekIndex: number }[] = [];
    let lastMonth = -1;
    allDays.forEach((day, index) => {
        const month = getMonth(day);
        if (month !== lastMonth) {
            currentMonthLabels.push({ name: format(day, 'MMM'), weekIndex: Math.floor(index / 7) });
            lastMonth = month;
        }
    });

    return { days: allDays, monthLabels: currentMonthLabels };
  }, [currentDate]);


  if (!currentDate || transactions.length === 0) {
    return (
      <Card className="w-full glassmorphic">
        <CardHeader>
          <CardTitle>Daily Activity Heatmap</CardTitle>
          <CardDescription>No spending data for heatmap.</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Upload expense transactions to visualize daily activity.</p>
        </CardContent>
      </Card>
    );
  }

  // Determine max spending for color scale, cap for better visualization
  const maxSpending = Math.max(...Array.from(dailySpending.values()), 0);
  const cappedMaxSpending = Math.min(maxSpending, (maxSpending > 1000 ? 1000 : maxSpending) || 100); // Cap at $1000 or actual max if lower

  const getColorIntensity = (amount: number): string => {
    if (amount <= 0) return 'bg-muted/20'; // No spending or income
    const percentage = Math.min(amount / cappedMaxSpending, 1); // Normalize to 0-1
    if (percentage < 0.1) return 'bg-primary/20';
    if (percentage < 0.3) return 'bg-primary/40';
    if (percentage < 0.6) return 'bg-primary/60';
    if (percentage < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };
  
  const gridColsClass = `grid-cols-[repeat(${Math.ceil(days.length / 7)},minmax(0,1fr))]`;
  const dayCellSize = "w-4 h-4 md:w-5 md:h-5"; // Responsive cell size

  return (
    <Card className="w-full glassmorphic">
      <CardHeader>
        <CardTitle>Daily Activity Heatmap</CardTitle>
        <CardDescription>Visual representation of spending activity over the last {MONTHS_TO_DISPLAY} months.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <TooltipProvider delayDuration={100}>
        <div className="flex gap-3">
            {/* Day labels */}
            <div className="grid grid-rows-7 gap-1 mr-1 shrink-0">
                {DAYS_OF_WEEK.map((day, i) => (i % 2 === 0 || DAYS_OF_WEEK.length < 8) && ( // Show fewer labels if cramped
                    <div key={day} className={cn("text-xs text-muted-foreground flex items-center", dayCellSize)}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Heatmap Grid */}
            <div className="relative flex-grow">
                {/* Month Labels */}
                <div className={cn("grid gap-1 mb-1", gridColsClass)}>
                    {monthLabels.map((label, index) => (
                        <div key={index} className="text-xs text-muted-foreground text-center" style={{ gridColumnStart: label.weekIndex +1 }}>
                            {label.name}
                        </div>
                    ))}
                </div>
                {/* Cells */}
                <div className={cn("grid grid-flow-col grid-rows-7 gap-1", gridColsClass)}>
                    {days.map((day, index) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const spending = dailySpending.get(dayKey) || 0;
                    const colorClass = getColorIntensity(spending);
                    const isFutureDay = day > currentDate;
                    
                    return (
                        <Tooltip key={index}>
                        <TooltipTrigger asChild>
                            <div
                            className={cn(
                                dayCellSize,
                                'rounded-sm transition-all duration-150 ease-in-out',
                                isFutureDay ? 'bg-background opacity-50' : colorClass,
                                'hover:ring-2 hover:ring-primary/50 hover:scale-110'
                            )}
                            data-date={dayKey}
                            data-amount={spending}
                            />
                        </TooltipTrigger>
                        {!isFutureDay && (
                            <TooltipContent className="bg-background/80 backdrop-blur-sm border-border shadow-lg">
                            <p className="font-semibold">{format(day, 'MMM d, yyyy')}</p>
                            <p>Spending: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(spending)}</p>
                            </TooltipContent>
                        )}
                        </Tooltip>
                    );
                    })}
                </div>
            </div>
        </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
