export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  category: string; // Made category non-optional for easier processing
}
