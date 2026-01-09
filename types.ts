
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note?: string;
}

export interface Budget {
  limit: number;
  period: 'monthly';
}

export type TimeFilter = 'today' | 'week' | 'month' | 'all';
