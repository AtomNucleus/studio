
'use client';

import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowUpDown, CalendarIcon, FilterIcon, SearchIcon, Edit3Icon, DownloadIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import type { Transaction } from './types';
import { cn } from '@/lib/utils';

interface TransactionTableProps {
  transactions: Transaction[];
  onSearchTermChange: (term: string) => void;
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  onSortChange: (descriptor: { column: keyof Transaction | null; direction: 'asc' | 'desc' } | null) => void;
  currentSortDescriptor: { column: keyof Transaction | null; direction: 'asc' | 'desc' } | null;
  onTransactionCategoryChange: (transactionId: string, newCategory: string) => void;
  onTransactionFieldUpdate: (transactionId: string, field: 'date' | 'description' | 'amount', value: any) => void;
}

const CATEGORIES = ["Food & Drink", "Groceries", "Transport", "Housing", "Income", "Entertainment", "Shopping", "Utilities", "Healthcare", "Miscellaneous", "Uncategorized", "Transfer/Income", "Bills", "Subscriptions", "Travel", "Gifts", "Personal Care", "Education", "Business", "Donation", "Food/Restaurant", "Bill Payment", "Subscription/Bill", "Pharmacy/Health", "Food/Groceries", "Income/Payroll", "Fee Reversal", "Bill Payment/Loan", "Shopping/General", "Shopping/Convenience", "Entertainment/Food", "Gas/Automotive", "Giving/Donations", "Other", "Food & Dining", "Subscription & Software", "Bills & Payments"];


type EditableCell = {
  id: string;
  column: 'date' | 'description' | 'amount';
} | null;


export default function TransactionTable({ 
  transactions,
  onSearchTermChange,
  onDateRangeChange,
  onSortChange,
  currentSortDescriptor,
  onTransactionCategoryChange,
  onTransactionFieldUpdate
}: TransactionTableProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [editingCell, setEditingCell] = useState<EditableCell>(null);
  const [currentEditValue, setCurrentEditValue] = useState<string | number>('');

  const handleSort = (column: keyof Transaction) => {
    onSortChange({ column, direction: currentSortDescriptor?.column === column && currentSortDescriptor.direction === 'asc' ? 'desc' : 'asc' });
  };
  
  const uniqueCategoriesForFilter = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    const combined = new Set([...CATEGORIES, ...Array.from(cats)]);
    return ["all", ...Array.from(combined).filter(Boolean).sort()];
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    return transactions.filter(t => 
      categoryFilter === 'all' || (t.category && t.category.toLowerCase() === categoryFilter.toLowerCase())
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

  const startEditing = useCallback((transactionId: string, column: 'date' | 'description' | 'amount', currentValue: any) => {
    setEditingCell({ id: transactionId, column });
    if (column === 'date' && currentValue instanceof Date) {
      setCurrentEditValue(format(currentValue, 'yyyy-MM-dd'));
    } else {
      setCurrentEditValue(currentValue);
    }
  }, []);

  const handleEditValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCurrentEditValue(e.target.value);
  };

  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    const { id, column } = editingCell;
    let valueToSave: string | number | Date = currentEditValue;

    if (column === 'date') {
      try {
        valueToSave = parseISO(currentEditValue as string); 
        if (isNaN(valueToSave.getTime())) throw new Error("Invalid date");
      } catch {
         console.error("Invalid date format:", currentEditValue);
         setEditingCell(null); 
         return;
      }
    } else if (column === 'amount') {
      valueToSave = parseFloat(currentEditValue as string);
      if (isNaN(valueToSave as number)) {
        console.error("Invalid amount:", currentEditValue);
        setEditingCell(null); 
        return;
      }
    }
    
    onTransactionFieldUpdate(id, column, valueToSave);
    setEditingCell(null);
  }, [editingCell, currentEditValue, onTransactionFieldUpdate]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  
  const handleInputBlur = () => {
    // If editing cell is date, don't save on blur, allow calendar interaction
    if (editingCell && editingCell.column === 'date') {
      // Check if the new value is different or still default before saving.
      // This logic might need to be more robust depending on how calendar updates state.
      const originalTransaction = transactions.find(t => t.id === editingCell.id);
      if (originalTransaction && format(new Date(originalTransaction.date), 'yyyy-MM-dd') !== currentEditValue) {
        saveEdit();
      } else if (!originalTransaction) { // New transaction maybe? Not applicable here.
        saveEdit();
      }
      // Otherwise, if it's not a date or value hasn't changed from a valid original,
      // we might not want to save, or handle specific blur scenarios.
      // For simplicity now, if it's not date, we save.
      return; 
    }
    saveEdit();
  };

  const handleDownloadCSV = useCallback(() => {
    const csvRows = [];
    // Add header row
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    csvRows.push(headers.join(','));

    // Add data rows
    for (const transaction of displayedTransactions) {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd');
      // Escape commas and quotes in description and category
      const description = `"${transaction.description.replace(/"/g, '""')}"`;
      const category = `"${(transaction.category || '').replace(/"/g, '""')}"`;
      const amount = transaction.amount.toString();
      csvRows.push([date, description, category, amount].join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'transactions.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [displayedTransactions]);


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
                onSelect={(date) => {
                  handleDateFromChange(date);
                  if(editingCell?.column === 'date') saveEdit(); // Save if editing date cell
                }}
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
                onSelect={(date) => {
                  handleDateToChange(date);
                  if(editingCell?.column === 'date') saveEdit(); // Save if editing date cell
                }}
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
              {uniqueCategoriesForFilter.map(cat => (
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
                  <TableRow 
                    key={transaction.id} 
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Could open custom context menu here for more advanced editing if DropdownMenu is not sufficient
                    }}
                  >
                    <TableCell 
                      className="cursor-cell"
                      onClick={() => !editingCell && startEditing(transaction.id, 'date', transaction.date)}
                    >
                      {editingCell?.id === transaction.id && editingCell?.column === 'date' ? (
                        <Input
                          type="date"
                          value={currentEditValue as string}
                          onChange={handleEditValueChange}
                          onBlur={handleInputBlur}
                          onKeyDown={handleInputKeyDown}
                          autoFocus
                          className="h-8 text-sm p-1"
                        />
                      ) : (
                        format(new Date(transaction.date), 'PP')
                      )}
                    </TableCell>
                    <TableCell 
                      className="font-medium cursor-cell"
                      onClick={() => !editingCell && startEditing(transaction.id, 'description', transaction.description)}
                    >
                       {editingCell?.id === transaction.id && editingCell?.column === 'description' ? (
                        <Input
                          type="text"
                          value={currentEditValue as string}
                          onChange={handleEditValueChange}
                          onBlur={handleInputBlur}
                          onKeyDown={handleInputKeyDown}
                          autoFocus
                          className="h-8 text-sm p-1 w-full"
                        />
                      ) : (
                        transaction.description
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full h-auto p-1 text-left justify-start font-normal group hover:bg-accent/50 data-[state=open]:bg-accent/50"
                          >
                            <span className="truncate flex-grow">{transaction.category || 'Uncategorized'}</span>
                            <Edit3Icon className="ml-auto h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 flex-shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto">
                          <DropdownMenuLabel>Change Category</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup 
                            value={transaction.category} 
                            onValueChange={(newCategory) => onTransactionCategoryChange(transaction.id, newCategory)}
                          >
                            {CATEGORIES.filter(Boolean).sort().map((cat) => (
                              <DropdownMenuRadioItem key={cat} value={cat}>
                                {cat}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell 
                      className={cn(
                        "text-right font-semibold cursor-cell",
                        editingCell?.id !== transaction.id || editingCell?.column !== 'amount' 
                          ? (transaction.amount < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-500')
                          : ''
                      )}
                      onClick={() => !editingCell && startEditing(transaction.id, 'amount', transaction.amount)}
                    >
                      {editingCell?.id === transaction.id && editingCell?.column === 'amount' ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={currentEditValue as number}
                          onChange={handleEditValueChange}
                          onBlur={handleInputBlur}
                          onKeyDown={handleInputKeyDown}
                          autoFocus
                          className="h-8 text-sm p-1 text-right"
                        />
                      ) : (
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount)
                      )}
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
        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            {displayedTransactions.length > 0 && (
            <p className="text-sm text-muted-foreground">Showing {displayedTransactions.length} transactions.</p>
            )}
            <Button onClick={handleDownloadCSV} variant="outline" size="sm" disabled={displayedTransactions.length === 0}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download CSV
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

