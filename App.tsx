import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  History as HistoryIcon, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download,
  Filter,
  Trash2,
  X,
  ChevronRight,
  User,
  CloudCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { format, isSameDay, isAfter } from 'date-fns';
import * as XLSX from 'xlsx';

import { Transaction, TransactionType, TimeFilter, Budget } from './types';
import { CATEGORIES, APP_STORAGE_KEY } from './constants';

// --- Helper Components ---

const GlassCard: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`glass rounded-3xl p-6 ${className}`}>
    {children}
  </div>
);

// --- Main App Component ---

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<Budget>({ limit: 2000, period: 'monthly' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'budget'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setTransactions(parsed.transactions || []);
      setBudget(parsed.budget || { limit: 2000, period: 'monthly' });
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ transactions, budget }));
  }, [transactions, budget]);

  // Derived State
  const totals = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = totals.income - totals.expense;

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      if (timeFilter === 'today') return isSameDay(tDate, now);
      if (timeFilter === 'week') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        return isAfter(tDate, start);
      }
      if (timeFilter === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return isAfter(tDate, start);
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, timeFilter]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dayLabel = format(date, 'MMM dd');
      const amount = transactions
        .filter(t => t.type === 'expense' && isSameDay(new Date(t.date), date))
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: dayLabel, amount };
    });
    return days;
  }, [transactions]);

  const pieData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryMap).map(([id, value]) => ({
      name: CATEGORIES.find(c => c.id === id)?.name || id,
      value
    }));
  }, [transactions]);

  // Handlers
  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newT = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setTransactions(prev => [newT, ...prev]);
    setShowAddModal(false);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions.map(t => ({
      Date: format(new Date(t.date), 'yyyy-MM-dd'),
      Title: t.title,
      Type: t.type,
      Category: t.category,
      Amount: t.amount,
      Note: t.note || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "LuxeSpend_History.xlsx");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative overflow-hidden">
      {/* Top Header */}
      <div className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-400 p-0.5 bg-indigo-500/20">
            <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center">
              <User className="text-white w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-slate-400 text-xs uppercase tracking-widest font-bold">Good Morning</h1>
              <div className="flex items-center gap-1 bg-teal-500/10 px-1.5 py-0.5 rounded text-[8px] text-teal-400 font-bold uppercase tracking-tighter animate-pulse">
                <CloudCheck size={8} /> Netlify Live
              </div>
            </div>
            <h2 className="text-xl font-bold">Premium User</h2>
          </div>
        </div>
        <button 
          onClick={exportToExcel}
          className="p-2.5 rounded-2xl glass-dark text-indigo-400 hover:text-white transition-colors"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Dynamic Content */}
      <main className="px-6 space-y-6">
        {activeTab === 'dashboard' && (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <span className="text-indigo-100 text-sm font-medium opacity-80">Total Balance</span>
                <h3 className="text-4xl font-bold mt-1 tracking-tight">${balance.toLocaleString()}</h3>
                <div className="flex gap-4 mt-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowDownLeft size={16} className="text-emerald-300" />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-100/60 block uppercase font-bold">Income</span>
                      <span className="text-sm font-semibold">${totals.income.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowUpRight size={16} className="text-rose-300" />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-100/60 block uppercase font-bold">Expense</span>
                      <span className="text-sm font-semibold">${totals.expense.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold">Spending Trend</h4>
                <select 
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                  className="bg-transparent text-xs font-bold text-indigo-400 outline-none border-none focus:ring-0 cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </div>

              <GlassCard className="h-64 px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      dy={10}
                    />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#818cf8' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#818cf8" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </GlassCard>

              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="h-48 flex flex-col items-center justify-center p-4 text-center">
                  <h5 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tighter">Category Weight</h5>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORIES[index % CATEGORIES.length].color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="h-48 flex flex-col justify-between p-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Netlify Edge Budget</div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xl font-bold">${totals.expense.toLocaleString()}</span>
                      <span className="text-[10px] text-indigo-400 font-bold">/ ${budget.limit}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((totals.expense / budget.limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Recent Transactions Mini List */}
            <div className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold">Recent Activity</h4>
                <button onClick={() => setActiveTab('history')} className="text-xs text-indigo-400 font-bold hover:underline">See All</button>
              </div>
              <div className="space-y-3">
                {filteredTransactions.slice(0, 3).map(t => (
                  <TransactionItem key={t.id} transaction={t} onDelete={deleteTransaction} />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">History</h2>
              <div className="flex gap-2">
                <button className="p-2 glass rounded-xl"><Filter size={18} className="text-indigo-400" /></button>
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(['all', 'today', 'week', 'month'] as TimeFilter[]).map(f => (
                <button 
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    timeFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'glass text-slate-400'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <TransactionItem key={t.id} transaction={t} onDelete={deleteTransaction} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-50">
                  <HistoryIcon size={48} className="mb-4" />
                  <p className="font-medium">Clean Slate</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6 pt-2">
            <h2 className="text-2xl font-bold">Cloud Budget</h2>
            
            <GlassCard className="p-8 text-center space-y-6">
              <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center mx-auto relative">
                <div className="text-3xl text-indigo-400">⚡</div>
                <div 
                  className="absolute inset-0 border-4 border-indigo-500 rounded-full"
                  style={{ 
                    clipPath: `inset(0 ${100 - Math.min((totals.expense / budget.limit) * 100, 100)}% 0 0)`
                  }}
                ></div>
              </div>
              
              <div>
                <span className="text-slate-400 text-sm font-medium">Monthly Allocation</span>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-4xl font-bold tracking-tight">${budget.limit}</span>
                  <button onClick={() => {
                    const val = prompt('Enter new monthly budget:', budget.limit.toString());
                    if (val && !isNaN(Number(val))) setBudget({ ...budget, limit: Number(val) });
                  }} className="p-2 glass rounded-lg text-indigo-400 hover:text-white">
                    <X size={14} className="rotate-45" />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Consumed</span>
                  <span className="font-bold text-rose-400">${totals.expense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Available</span>
                  <span className="font-bold text-emerald-400">${Math.max(0, budget.limit - totals.expense).toLocaleString()}</span>
                </div>
              </div>
            </GlassCard>

            <h4 className="text-lg font-bold px-1 text-slate-200">Insights</h4>
            <div className="space-y-3">
              {pieData.sort((a,b) => b.value - a.value).map((cat, i) => (
                <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between border-l-4" style={{ borderColor: CATEGORIES.find(c => c.name === cat.name)?.color }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-lg">
                      {CATEGORIES.find(c => c.name === cat.name)?.icon || '💸'}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{cat.name}</p>
                      <div className="w-24 bg-white/5 h-1.5 rounded-full mt-1">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(cat.value / Math.max(1, totals.expense)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm">${cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-600/40 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#020617]/80 backdrop-blur-2xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50 max-w-md mx-auto">
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={24} />} label="Stats" />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<HistoryIcon size={24} />} label="Activity" />
        <NavButton active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} icon={<Wallet size={24} />} label="Funds" />
      </nav>

      {/* Add Transaction Modal */}
      {showAddModal && <AddModal onAdd={addTransaction} onClose={() => setShowAddModal(false)} />}
    </div>
  );
}

// --- Sub-Components ---

// --- Fix: Using React.FC to allow standard props like 'key' and improve type safety ---
const NavButton: React.FC<{ active: boolean, icon: React.ReactNode, label: string, onClick: () => void }> = ({ active, icon, label, onClick }) => {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'}`}>
      <div className={`${active ? 'bg-indigo-400/10 p-2 rounded-2xl' : 'p-2'}`}>{icon}</div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

// --- Fix: Using React.FC to allow standard props like 'key' in list rendering ---
const TransactionItem: React.FC<{ transaction: Transaction, onDelete: (id: string) => void }> = ({ transaction, onDelete }) => {
  const category = CATEGORIES.find(c => c.id === transaction.category) || CATEGORIES[CATEGORIES.length - 1];
  
  return (
    <div className="glass group relative overflow-hidden transition-all active:scale-[0.98]">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl glass items-center justify-center flex text-2xl shadow-inner">
            {category.icon}
          </div>
          <div>
            <h5 className="font-bold text-sm text-slate-100">{transaction.title}</h5>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mt-0.5">
              {format(new Date(transaction.date), 'MMM dd')} • {category.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`font-bold text-base ${transaction.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
          </span>
          <button 
            onClick={() => onDelete(transaction.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-slate-600 hover:text-rose-500 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${transaction.type === 'income' ? 'bg-emerald-500' : 'bg-indigo-500/30'}`}></div>
    </div>
  );
}

// --- Fix: Using React.FC for consistent type safety ---
const AddModal: React.FC<{ onAdd: (t: Omit<Transaction, 'id'>) => void, onClose: () => void }> = ({ onAdd, onClose }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    onAdd({
      title,
      amount: parseFloat(amount),
      type,
      category,
      date,
      note
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold">Log Transaction</h3>
          <button onClick={onClose} className="p-2 glass rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex p-1 glass rounded-2xl">
            <button 
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Expense
            </button>
            <button 
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}
            >
              Income
            </button>
          </div>

          <div className="space-y-4">
            <div className="glass p-1 rounded-2xl border-white/5">
              <input 
                autoFocus
                type="text" 
                placeholder="Transaction Title" 
                className="w-full bg-transparent p-4 outline-none text-slate-100 placeholder:text-slate-600 font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="glass p-1 rounded-2xl border-white/5 flex items-center">
              <span className="pl-5 text-indigo-400 font-bold">$</span>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                className="w-full bg-transparent p-4 outline-none text-slate-100 placeholder:text-slate-600 font-bold text-xl"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-1 rounded-2xl border-white/5 overflow-hidden">
                <select 
                  className="w-full bg-transparent p-4 outline-none text-slate-400 text-sm font-medium appearance-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#0f172a]">{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div className="glass p-1 rounded-2xl border-white/5">
                <input 
                  type="date" 
                  className="w-full bg-transparent p-4 outline-none text-slate-400 text-sm font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="glass p-1 rounded-2xl border-white/5">
              <textarea 
                placeholder="Add notes..." 
                className="w-full bg-transparent p-4 outline-none text-slate-100 placeholder:text-slate-600 text-sm font-medium resize-none h-20"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className={`w-full py-5 rounded-3xl text-white font-bold text-lg shadow-xl transition-all active:scale-95 ${
              type === 'expense' ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-emerald-600 shadow-emerald-600/20'
            }`}
          >
            Confirm Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
