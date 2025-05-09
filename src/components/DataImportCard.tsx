
'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from "@/components/ui/progress";
import type { Transaction } from '@/components/transactions/types';
import { parseCSV, parseTSV, parseTXT } from '@/lib/fileParser';
import { useToast } from "@/hooks/use-toast";

interface DataImportCardProps {
  onTransactionsUploaded: (transactions: Transaction[]) => void;
}

export default function DataImportCard({ onTransactionsUploaded }: DataImportCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for file type (client-side)
      const allowedTypes = ['text/csv', 'text/tab-separated-values', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      // Note: XLSX (.xlsx) parsing is complex and not fully implemented here without a library.
      // This component will primarily handle CSV/TSV/TXT.
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.tsv') && !file.name.endsWith('.txt') && !file.name.endsWith('.xlsx')) {
         setError('Unsupported file type. Please upload CSV, TSV, TXT, or XLSX.');
         setSelectedFile(null);
         return;
      }
      if (file.name.endsWith('.xlsx')) {
        toast({
          title: "XLSX Support Limited",
          description: "XLSX file parsing is experimental and may not work for all files. CSV is recommended.",
          variant: "default",
        });
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const fileContent = await selectedFile.text(); // Changed from readAsText() to text()
      let parsedTransactions: Transaction[] = [];

      if (selectedFile.name.endsWith('.csv') || selectedFile.type === 'text/csv') {
        parsedTransactions = parseCSV(fileContent);
      } else if (selectedFile.name.endsWith('.tsv') || selectedFile.type === 'text/tab-separated-values') {
        parsedTransactions = parseTSV(fileContent);
      } else if (selectedFile.name.endsWith('.txt') || selectedFile.type === 'text/plain') {
        parsedTransactions = parseTXT(fileContent);
      } else if (selectedFile.name.endsWith('.xlsx')) {
        // XLSX parsing is complex and typically requires a library like SheetJS (xlsx).
        // For now, we'll show a message or attempt a very basic CSV-like parse if possible.
        setError('XLSX parsing is not fully supported yet. Please convert to CSV or try a simple XLSX file.');
        toast({
          title: "XLSX Upload",
          description: "Advanced XLSX features are not supported. If parsing fails, please convert to CSV.",
          variant: "destructive"
        });
        // As a fallback, try parsing as CSV (might work for very simple, single-sheet XLSX saved as CSV-like text)
        parsedTransactions = parseCSV(fileContent); 
      } else {
        setError('Unsupported file type.');
        setIsParsing(false);
        return;
      }
      
      if (parsedTransactions.length > 0) {
        onTransactionsUploaded(parsedTransactions);
        toast({
          title: "Success!",
          description: `${parsedTransactions.length} transactions imported from ${selectedFile.name}.`,
        });
        setSelectedFile(null); // Clear selection after successful upload
      } else {
        setError(`No transactions found or file format error in ${selectedFile.name}. Ensure it has Date, Description, Amount.`);
        toast({
          title: "Parsing Issue",
          description: `Could not parse transactions from ${selectedFile.name}. Check file format.`,
          variant: "destructive"
        });
      }

    } catch (e) {
      console.error('Error parsing file:', e);
      setError('Failed to read or parse the file. Ensure it is a valid text-based format (CSV, TSV, TXT).');
      toast({
          title: "File Error",
          description: "Could not read or parse the file.",
          variant: "destructive"
        });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Card className="w-full glassmorphic">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-6 w-6 text-primary" />
          Import Transactions
        </CardTitle>
        <CardDescription>Upload your transaction data from CSV, TSV, or TXT files. Basic XLSX support is experimental.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.tsv,.txt,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center text-center"
          >
            <UploadCloud className="h-12 w-12 text-muted-foreground mb-2" />
            <span className="text-primary font-semibold">Click to upload</span>
            <span className="text-xs text-muted-foreground">or drag and drop</span>
            <p className="text-xs text-muted-foreground mt-1">CSV, TSV, TXT, XLSX (experimental)</p>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>{selectedFile.name}</span>
            </div>
            <span className="text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</span>
          </div>
        )}

        {isParsing && <Progress value={undefined} className="w-full h-2 animate-pulse" />}
        
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        <Button onClick={handleParseFile} disabled={!selectedFile || isParsing} className="w-full">
          {isParsing ? 'Parsing...' : 'Import Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
