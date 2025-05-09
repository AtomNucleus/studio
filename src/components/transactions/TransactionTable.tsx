'use client';

import type { ChangeEvent } from 'react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowUpDown, CalendarIcon, FilterIcon, SearchIcon } from 'lucide-react';
import type { Transaction } from './types';

interface TransactionTableProps {
  transactions: Transaction[];
  onSearchTermChange: (term: string) => void;
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  onSortChange: (descriptor: { column: keyof Transaction | null; direction: 'asc' | 'desc' } | null) => void;
  currentSortDescriptor: { column: keyof Transaction | null; direction: 'asc' | 'desc' } | null;
}

const CATEGORIES = ["Food & Drink", "Groceries", "Transport", "Housing", "Income", "Entertainment", "Shopping", "Utilities", "Healthcare", "Miscellaneous", "Uncategorized"];


export default function TransactionTable({ 
  transactions,
  onSearchTermChange,
  onDateRangeChange,
  onSortChange,
  currentSortDescriptor
}: TransactionTableProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleSort = (column: keyof Transaction) => {
    const direction = currentSortDescriptor && currentSortDescriptor.column === column && currentSortDescriptor.direction === 'asc' ? 'desc' : 'asc';
    onSortChange({ column, direction });
  };
  
  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ["all", ...Array.from(cats).sort()];
  }, [transactions]);


  const displayedTransactions = useMemo(() => {
    return transactions.filter(t => 
      categoryFilter === 'all' || t.category.toLowerCase() === categoryFilter.toLowerCase()
    );
  }, [transactions, categoryFilter]);


  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(event.target.value);
    onSearchTermChange(event.target.value);
  };
  
  const handleDateFromChange = (date?: Date) => {
    setDateFrom(date);
    onDateRangeChange({ from: date, to: dateTo });
  };

  const handleDateToChange = (date?: Date) => {
    setDateTo(date);
    onDateRangeChange({ from: dateFrom, to: date });
  };

  return (
    <Card className="w-full glassmorphic">
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search description, category..."
              value={internalSearchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "LLL dd, y") : <span>From Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={handleDateFromChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "LLL dd, y") : <span>To Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={handleDateToChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-auto">
              <FilterIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('date')} className="cursor-pointer hover:bg-muted/50">
                  Date <ArrowUpDown className={`ml-2 h-4 w-4 inline ${currentSortDescriptor?.column === 'date' ? 'text-primary': ''}`} />
                </TableHead>
                <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:bg-muted/50">
                  Description <ArrowUpDown className={`ml-2 h-4 w-4 inline ${currentSortDescriptor?.column === 'description' ? 'text-primary': ''}`} />
                </TableHead>
                <TableHead onClick={() => handleSort('category')} className="cursor-pointer hover:bg-muted/50">
                  Category <ArrowUpDown className={`ml-2 h-4 w-4 inline ${currentSortDescriptor?.column === 'category' ? 'text-primary': ''}`} />
                </TableHead>
                <TableHead onClick={() => handleSort('amount')} className="text-right cursor-pointer hover:bg-muted/50">
                  Amount <ArrowUpDown className={`ml-2 h-4 w-4 inline ${currentSortDescriptor?.column === 'amount' ? 'text-primary': ''}`} />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), 'PP')}</TableCell>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className={`text-right font-semibold ${transaction.amount < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No transactions found for the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
         {displayedTransactions.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">Showing {displayedTransactions.length} transactions.</p>
        )}
      </CardContent>
    </Card>
  );
}
