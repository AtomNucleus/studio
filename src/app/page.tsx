
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Transaction } from '@/components/transactions/types';
import DataImportCard from '@/components/DataImportCard';
import VisualizationsSection from '@/components/VisualizationsSection';
import TransactionTable from '@/components/transactions/TransactionTable';
import VisionSpendLogo from '@/components/icons/VisionSpendLogo';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes'; 

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientMounted, setClientMounted] = useState(false);

  // Filter and sort states for TransactionTable
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sortDescriptor, setSortDescriptor] = useState<{ column: keyof Transaction | null; direction: 'asc' | 'desc' } | null>({ column: 'date', direction: 'desc' });
  
  const { theme, setTheme } = useTheme();
  
  // Local state to track current theme to avoid hydration issues with useTheme initially
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Set the initial theme based on system preference or stored theme
    // This helps ensure the button icon is correct on initial load
    // It relies on ThemeProvider from next-themes being set up in layout or providers
    const storedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setCurrentTheme(storedTheme as 'light' | 'dark');
  }, []);
  

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setCurrentTheme(newTheme); // Keep local state in sync for immediate UI update of icon
  };


  useEffect(() => {
    setClientMounted(true);
    // Simulate initial loading if necessary, or remove if data loads quickly
    setTimeout(() => setIsLoading(false), 500); 
  }, []);

  const handleTransactionsUploaded = useCallback((newTransactions: Transaction[]) => {
    setTransactions(prev => {
      // Avoid duplicates by checking IDs if parsers guarantee unique IDs for a session or use content hash
      const existingIds = new Set(prev.map(t => t.id));
      const uniqueNewTransactions = newTransactions.filter(t => !existingIds.has(t.id));
      const combined = [...prev, ...uniqueNewTransactions];
      // Sort by date descending by default
      return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    let items = [...transactions];
    
    if (searchTerm) {
      items = items.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (dateRange.from) {
      items = items.filter(t => new Date(t.date) >= dateRange.from!);
    }
    if (dateRange.to) {
      items = items.filter(t => new Date(t.date) <= dateRange.to!);
    }
    
    if (sortDescriptor && sortDescriptor.column) {
      const column = sortDescriptor.column;
      items.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        let comparison = 0;

        if (typeof valA === 'string' && typeof valB === 'string') {
          comparison = valA.localeCompare(valB);
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else if (valA instanceof Date && valB instanceof Date) {
          comparison = valA.getTime() - valB.getTime();
        } else { // Fallback for mixed or undefined types
            if (valA === undefined || valA === null) comparison = -1;
            else if (valB === undefined || valB === null) comparison = 1;
            else comparison = String(valA).localeCompare(String(valB));
        }
        
        return sortDescriptor.direction === 'desc' ? comparison * -1 : comparison;
      });
    }
    return items;
  }, [transactions, searchTerm, dateRange, sortDescriptor]);

  if (!clientMounted || isLoading) {
    return (
      <div className="min-h-screen w-full p-4 md:p-8 bg-gradient-to-br from-background to-secondary/30">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-40" />
          </div>
          <Skeleton className="h-10 w-10 rounded-md" />
        </header>
        <main className="space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-4 md:p-8 bg-gradient-to-br from-background to-secondary/20 dark:from-background dark:to-secondary/10 transition-colors duration-300">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VisionSpendLogo className="h-10 w-10" />
          <h1 className="text-3xl font-bold text-foreground">VisionSpend</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </header>

      <main className="space-y-6">
        <DataImportCard onTransactionsUploaded={handleTransactionsUploaded} />
        
        {transactions.length > 0 && (
          <>
            <VisualizationsSection transactions={transactions} />
            <TransactionTable
              transactions={filteredAndSortedTransactions}
              onSearchTermChange={setSearchTerm}
              onDateRangeChange={setDateRange}
              onSortChange={setSortDescriptor}
              currentSortDescriptor={sortDescriptor}
            />
          </>
        )}

        {transactions.length === 0 && (
           <div className="text-center py-12 glassmorphic rounded-lg">
             <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to VisionSpend</h2>
             <p className="text-muted-foreground">Upload your transaction data to begin analyzing your spending.</p>
             <p className="text-sm text-muted-foreground mt-2">Supported formats: CSV, TSV, TXT. Basic XLSX is experimental.</p>
           </div>
        )}
      </main>
      <footer className="text-center mt-12 py-6 text-sm text-muted-foreground">
        VisionSpend &copy; {new Date().getFullYear()} - Modern spending clarity.
      </footer>
    </div>
  );
}
