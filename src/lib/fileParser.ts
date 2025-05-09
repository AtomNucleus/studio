import type { Transaction } from '@/components/transactions/types';

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Basic category inference (can be expanded)
const inferCategory = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  if (lowerDesc.includes('coffee') || lowerDesc.includes('starbucks') || lowerDesc.includes('cafe')) return 'Food & Drink';
  if (lowerDesc.includes('grocery') || lowerDesc.includes('market')) return 'Groceries';
  if (lowerDesc.includes('transport') || lowerDesc.includes('uber') || lowerDesc.includes('lyft') || lowerDesc.includes('taxi')) return 'Transport';
  if (lowerDesc.includes('rent') || lowerDesc.includes('mortgage')) return 'Housing';
  if (lowerDesc.includes('salary') || lowerDesc.includes('invoice') && !lowerDesc.includes('payment')) return 'Income'; // simple income detection
  return 'Miscellaneous';
};

const parseLine = (line: string, delimiter: string): Partial<Transaction> | null => {
  const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, '')); // Handle quoted values
  if (values.length < 3) return null; // Expect at least Date, Description, Amount

  // Attempt to parse date, description, amount from common positions
  // This is a heuristic and might need adjustment based on common CSV formats
  // Example: Date, Description, Amount, Category (optional)
  // Or: Date, Amount, Description
  
  let dateStr = values[0];
  let description = '';
  let amountStr = '';
  let category = values[3] || '';

  // Try to intelligently find amount (likely a number)
  // Try typical positions first: values[2] or values[1]
  if (!isNaN(parseFloat(values[2]))) {
    amountStr = values[2];
    description = values[1];
  } else if (!isNaN(parseFloat(values[1]))) {
    amountStr = values[1];
    description = values[2] || values[0]; // If amount is second, description might be third or first
  } else { // Fallback if amount not in typical pos
    for (let i = 1; i < values.length; i++) {
      if (!isNaN(parseFloat(values[i]))) {
        amountStr = values[i];
        // Assume description is the field before or after if not explicitly found
        description = values[i-1] || values[i+1] || 'Unknown Description';
        break;
      }
    }
  }
  
  if (!dateStr || !description || !amountStr) return null;

  const date = new Date(dateStr);
  const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g,"")); // Clean amount string

  if (isNaN(date.getTime()) || isNaN(amount)) return null;

  return {
    date,
    description,
    amount,
    category: category || inferCategory(description),
  };
};


const parseDelimitedFile = (fileContent: string, delimiter: string): Transaction[] => {
  const transactions: Transaction[] = [];
  const lines = fileContent.split(/\r?\n/);

  // Skip header line, attempt to auto-detect if first line looks like data
  const startIndex = (lines[0] && lines[0].toLowerCase().includes('date') && lines[0].toLowerCase().includes('description')) ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const parsed = parseLine(line, delimiter);
    if (parsed && parsed.date && parsed.description && parsed.amount !== undefined) {
      transactions.push({
        id: generateId(),
        date: parsed.date,
        description: parsed.description,
        amount: parsed.amount,
        category: parsed.category || 'Uncategorized',
      });
    }
  }
  return transactions;
};

export const parseCSV = (fileContent: string): Transaction[] => {
  return parseDelimitedFile(fileContent, ',');
};

export const parseTSV = (fileContent: string): Transaction[] => {
  return parseDelimitedFile(fileContent, '\t');
};

// For TXT, assume it's CSV-like or TSV-like. Try common delimiters.
export const parseTXT = (fileContent: string): Transaction[] => {
  // Try to guess delimiter (simple check)
  if (fileContent.includes('\t')) {
    return parseTSV(fileContent);
  }
  return parseCSV(fileContent); // Default to CSV
};
