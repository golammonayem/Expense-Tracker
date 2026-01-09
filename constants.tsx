
import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Food', icon: '🍔', color: '#f87171' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#fb923c' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#fbbf24' },
  { id: 'entertainment', name: 'Leisure', icon: '🎮', color: '#4ade80' },
  { id: 'health', name: 'Health', icon: '🏥', color: '#2dd4bf' },
  { id: 'salary', name: 'Salary', icon: '💰', color: '#60a5fa' },
  { id: 'others', name: 'Others', icon: '✨', color: '#c084fc' },
];

export const APP_STORAGE_KEY = 'luxe_spend_data_v1';
