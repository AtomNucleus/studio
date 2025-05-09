'use client';

import type { Transaction } from '@/components/transactions/types';
import SpendingBarChart from './charts/SpendingBarChart';
import CalendarHeatmap from './charts/CalendarHeatmap';

interface VisualizationsSectionProps {
  transactions: Transaction[];
}

export default function VisualizationsSection({ transactions }: VisualizationsSectionProps) {
  if (transactions.length === 0) {
    return null; // Don't render if no transactions
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingBarChart transactions={transactions} />
        <CalendarHeatmap transactions={transactions} />
      </div>
      {/* Future visualizations can be added here */}
    </section>
  );
}
