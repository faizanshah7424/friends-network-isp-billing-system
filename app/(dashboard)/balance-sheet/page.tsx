'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import {
  Landmark,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Download,
  AlertTriangle,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';

interface LedgerTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'Cash In' | 'Cash Out';
  amount: number;
  remarks: string;
}

const initialTransactions: LedgerTransaction[] = [
  {
    id: 'tx-0',
    date: '2026-07-01',
    description: 'Register Opening Balance',
    category: 'Opening Balance',
    type: 'Cash In',
    amount: 120000,
    remarks: 'Initial register opening amount',
  },
  {
    id: 'tx-1',
    date: '2026-07-02',
    description: 'Walk-in payment Muhammad Ali',
    category: 'Customer Payments',
    type: 'Cash In',
    amount: 3000,
    remarks: 'Invoice INV-2026-1001',
  },
  {
    id: 'tx-2',
    date: '2026-07-03',
    description: 'Office Bike Fuel replenishment',
    category: 'Fuel',
    type: 'Cash Out',
    amount: 1500,
    remarks: 'Clifton branch rider',
  },
  {
    id: 'tx-3',
    date: '2026-07-04',
    description: 'Walk-in payment Zainab Bibi',
    category: 'Customer Payments',
    type: 'Cash In',
    amount: 1100,
    remarks: 'Invoice INV-2026-1003',
  },
  {
    id: 'tx-4',
    date: '2026-07-05',
    description: 'Core Transit Feed Bill July',
    category: 'Internet Charges',
    type: 'Cash Out',
    amount: 45000,
    remarks: 'Core transit bandwidth Wateen',
  },
  {
    id: 'tx-5',
    date: '2026-07-06',
    description: 'Office Rent July 2026',
    category: 'Office Expenses',
    type: 'Cash Out',
    amount: 25000,
    remarks: 'Marine Heights Clifton Suite',
  },
  {
    id: 'tx-6',
    date: '2026-07-08',
    description: 'Walk-in Router Sale',
    category: 'Other Income',
    type: 'Cash In',
    amount: 3500,
    remarks: 'TP-Link dual band router sold to walk-in client',
  },
  {
    id: 'tx-7',
    date: '2026-07-10',
    description: 'Yasir Ahmed salary advance',
    category: 'Salary',
    type: 'Cash Out',
    amount: 18000,
    remarks: 'Field engineer advance payment',
  },
  {
    id: 'tx-8',
    date: '2026-07-11',
    description: 'Fiber splicing machine kit',
    category: 'Equipment Purchase',
    type: 'Cash Out',
    amount: 12000,
    remarks: 'Fujikura backup kit',
  },
  {
    id: 'tx-9',
    date: '2026-07-12',
    description: 'Office AC Servicing',
    category: 'Maintenance',
    type: 'Cash Out',
    amount: 4000,
    remarks: 'Server room split AC service',
  },
];

export default function BalanceSheetPage() {
  const { payments } = useBillingSystem();
  
  // Ledger state loaded from localStorage
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [txType, setTxType] = useState<'Cash In' | 'Cash Out'>('Cash Out');
  const [txCategory, setTxCategory] = useState('Salary');
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState(0);
  const [txDate, setTxDate] = useState('');
  const [txRemarks, setTxRemarks] = useState('');
  const [formError, setFormError] = useState('');

  // Filters State
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('2026-07-01');
  const [customEndDate, setCustomEndDate] = useState('2026-07-31');

  // Loader for PDF simulation
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel' | 'CSV' | null>(null);

  // Load transactions from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fnb_balance_sheet');
      
      // Auto-sync customer payments from Billing System Payments context!
      // This makes the ledger reactive and work like a real cash register
      const syncedPayments = payments.map((p) => ({
        id: `sync-${p.id}`,
        date: p.paymentDate.split(' ')[0],
        description: `Billing Payment: ${p.customerName}`,
        category: 'Customer Payments',
        type: 'Cash In' as const,
        amount: p.amountReceived,
        remarks: `Ref: ${p.referenceNumber || 'Cash Collection'}`,
      }));

      const baseList = stored ? JSON.parse(stored) : initialTransactions;
      
      // Merge base manual list and synced payments avoiding duplicates
      const merged = [...baseList];
      syncedPayments.forEach((sp) => {
        if (!merged.some((m) => m.id === sp.id)) {
          merged.push(sp);
        }
      });

      // Sort chronological
      merged.sort((a, b) => a.date.localeCompare(b.date));
      const timer = setTimeout(() => {
        setTransactions(merged);
        setIsLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [payments]);

  // Set default date on form mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setTxDate(new Date().toISOString().split('T')[0]);
    }, 0);
    return () => clearTimeout(timer);
  }, [dialogOpen]);

  // Save to localStorage
  const saveTransactions = (updated: LedgerTransaction[]) => {
    setTransactions(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fnb_balance_sheet', JSON.stringify(updated.filter(t => !t.id.startsWith('sync-'))));
    }
  };

  // Categories based on Type Selection
  const cashInCategories = ['Customer Payments', 'Other Income'];
  const cashOutCategories = [
    'Salary',
    'Office Expenses',
    'Equipment Purchase',
    'Maintenance',
    'Fuel',
    'Electricity',
    'Internet Charges',
    'Other Expenses',
  ];

  // Sync category dropdown options when type changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (txType === 'Cash In') {
        setTxCategory('Customer Payments');
      } else {
        setTxCategory('Salary');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [txType]);

  // Filtered transactions for the Table
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const currentDay = now.getDay();
      const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      switch (filterType) {
        case 'today':
          return date.toDateString() === startOfToday.toDateString();
        case 'week':
          return date >= startOfWeek && date <= now;
        case 'month':
          return date >= startOfMonth && date <= now;
        case 'year':
          return date >= startOfYear && date <= now;
        case 'custom':
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        default:
          return true;
      }
    });
  }, [transactions, filterType, customStartDate, customEndDate]);

  // Re-calculate running balances for filtered transactions dynamically!
  const finalLedgerData = useMemo(() => {
    let currentBalance = 0;
    const result = [];
    for (let i = 0; i < filteredTransactions.length; i++) {
      const t = filteredTransactions[i];
      if (t.type === 'Cash In') {
        currentBalance += t.amount;
      } else {
        currentBalance -= t.amount;
      }
      result.push({
        ...t,
        runningBalance: currentBalance,
      });
    }
    return result;
  }, [filteredTransactions]);

  // Totals calculations
  const openingBalance = useMemo(() => {
    // Find the first transaction of the type "Cash In" and category "Opening Balance"
    const open = transactions.find(t => t.category === 'Opening Balance');
    return open ? open.amount : 0;
  }, [transactions]);

  const totalCashIn = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'Cash In' && t.category !== 'Opening Balance')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalCashOut = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'Cash Out')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const closingBalance = useMemo(() => {
    return openingBalance + totalCashIn - totalCashOut;
  }, [openingBalance, totalCashIn, totalCashOut]);

  // Form Submit Add Transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription.trim() || txAmount <= 0 || !txDate) {
      setFormError('Please fill out description, date and enter a valid positive amount.');
      return;
    }

    const newTx: LedgerTransaction = {
      id: `tx-${Date.now()}`,
      date: txDate,
      description: txDescription,
      category: txCategory,
      type: txType,
      amount: txAmount,
      remarks: txRemarks,
    };

    const updated = [...transactions, newTx];
    updated.sort((a, b) => a.date.localeCompare(b.date));
    saveTransactions(updated);
    
    // Reset Form
    setTxDescription('');
    setTxAmount(0);
    setTxRemarks('');
    setDialogOpen(false);
  };

  // Delete Transaction (Manual ones only)
  const handleDeleteTransaction = (id: string) => {
    if (id.startsWith('sync-')) return; // cannot delete reactive synced billing payments
    const updated = transactions.filter((t) => t.id !== id);
    saveTransactions(updated);
  };

  // Export balance sheet report
  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    setExportFormat(format);
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      if (format === 'PDF') {
        window.print();
        return;
      }

      const headers = ['Date', 'Description', 'Category', 'Cash In (PKR)', 'Cash Out (PKR)', 'Running Balance (PKR)', 'Remarks'];
      const rows = finalLedgerData.map(t => [
        t.date,
        t.description,
        t.category,
        t.type === 'Cash In' ? t.amount : '-',
        t.type === 'Cash Out' ? t.amount : '-',
        t.runningBalance,
        t.remarks
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `FN_BalanceSheet_${filterType}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      {isExporting && (
        <LogoLoader
          overlay
          text={`Compiling ${exportFormat} Ledger Report...`}
          subtext="Friends Network ISP Cash Balance Engine"
          loadingText="Reconciling accounts and calculating running balances..."
        />
      )}

      {/* Header and Download Buttons (print:hidden) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-sans">Cash Ledger Register</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track daily cash register income, rider collection journals, salary outgoings, and Core bandwidth expenses.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Export options */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-sm flex-1 sm:flex-none justify-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Export:</span>
            <button
              onClick={() => handleExport('PDF')}
              className="flex h-8 items-center gap-1 rounded-lg hover:bg-slate-100 px-2.5 text-[11px] font-bold text-slate-655 text-slate-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('Excel')}
              className="flex h-8 items-center gap-1 rounded-lg hover:bg-slate-100 px-2.5 text-[11px] font-bold text-slate-655 text-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('CSV')}
              className="flex h-8 items-center gap-1 rounded-lg hover:bg-slate-100 px-2.5 text-[11px] font-bold text-slate-655 text-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <button
            onClick={() => {
              setDialogOpen(true);
              setFormError('');
            }}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all w-full sm:w-auto flex-1 sm:flex-none"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Cash register overview metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Opening Balance</span>
            <h3 className="text-2xl font-black mt-1.5 text-slate-800">PKR {openingBalance.toLocaleString()}</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Month base opening reserves</span>
          </div>
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Cash In (Revenue)</span>
            <h3 className="text-2xl font-black mt-1.5 text-emerald-500">PKR {totalCashIn.toLocaleString()}</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Client payments &amp; other receipts</span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Cash Out (Expenses)</span>
            <h3 className="text-2xl font-black mt-1.5 text-rose-500">PKR {totalCashOut.toLocaleString()}</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Salaries, office, bandwidth feed</span>
          </div>
          <div className="rounded-xl bg-rose-500/10 p-3 text-rose-600">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Closing Balance</span>
            <h3 className="text-2xl font-black mt-1.5 text-indigo-500">PKR {closingBalance.toLocaleString()}</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Current net cash register balance</span>
          </div>
          <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-650">
            <Landmark className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filters bar card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 text-left print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Filter className="h-4.5 w-4.5 text-primary" />
          <span>Ledger Filter Date Range</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          {/* Range dropdown */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Date Scope</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'today' | 'week' | 'month' | 'year' | 'custom')}
              className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date selection inputs */}
          {filterType === 'custom' && (
            <>
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">Start Date</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase">End Date</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Ledger Table Grid */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm text-left">
        <div className="border-b border-border bg-slate-500/5 px-5 py-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Landmark className="h-4.5 w-4.5 text-primary" />
            <span>Balance Sheet Ledger Journal</span>
          </h3>
        </div>

        {finalLedgerData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-right">Cash In (PKR)</th>
                  <th className="p-4 text-right">Cash Out (PKR)</th>
                  <th className="p-4 text-right">Running Balance</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs font-medium text-slate-600">
                {finalLedgerData.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-semibold">{t.date}</td>
                    <td className="p-4 font-bold text-slate-850">{t.description}</td>
                    <td className="p-4 text-[10px] uppercase font-bold text-slate-400">{t.category}</td>
                    <td className="p-4 text-right font-bold text-emerald-500">
                      {t.type === 'Cash In' ? `+PKR ${t.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-right font-bold text-rose-500">
                      {t.type === 'Cash Out' ? `-PKR ${t.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      PKR {t.runningBalance.toLocaleString()}
                    </td>
                    <td className="p-4 max-w-[150px] truncate text-muted-foreground">{t.remarks || 'N/A'}</td>
                    <td className="p-4 text-center print:hidden">
                      {t.id.startsWith('sync-') ? (
                        <span className="text-[9px] uppercase font-bold text-emerald-500/80 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          Synced
                        </span>
                      ) : t.category === 'Opening Balance' ? (
                        <span className="text-[9px] uppercase font-bold text-slate-450 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          System
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors flex items-center justify-center mx-auto"
                          title="Delete manual transaction entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-slate-400">
            <AlertTriangle className="h-10 w-10 text-slate-350 mx-auto mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-slate-700">No transaction logs recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              We couldn&apos;t find any cash ledger records matching your date filter range.
            </p>
          </div>
        )}
      </div>

      {/* Add Transaction Dialog Modal */}
      <AnimatePresence>
        {dialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDialogOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Dialog Form Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl z-10 space-y-4 text-left"
            >
              <button
                onClick={() => setDialogOpen(false)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h3 className="font-bold text-lg text-slate-800">Add Cash Book Transaction</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Post an entry to the ISP cash register ledger</p>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 animate-pulse" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddTransaction} className="space-y-4 text-xs font-medium">
                {/* Transaction Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType('Cash In')}
                      className={`h-9 rounded-xl border text-xs font-bold transition-all ${
                        txType === 'Cash In'
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-600'
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      Cash In (Income)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxType('Cash Out')}
                      className={`h-9 rounded-xl border text-xs font-bold transition-all ${
                        txType === 'Cash Out'
                          ? 'border-rose-500 bg-rose-50/40 text-rose-650 text-rose-600'
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      Cash Out (Expense)
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Description *</label>
                  <input
                    type="text"
                    required
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="e.g. Clifton Office Electricity Bill June"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Category</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                    >
                      {txType === 'Cash In'
                        ? cashInCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))
                        : cashOutCategories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                    </select>
                  </div>

                  {/* Transaction Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Date *</label>
                    <input
                      type="date"
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none focus:border-primary focus:bg-card"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Amount (PKR) *</label>
                  <input
                    type="number"
                    required
                    value={txAmount || ''}
                    onChange={(e) => setTxAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="e.g. 5000"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Remarks / Memo</label>
                  <input
                    type="text"
                    value={txRemarks}
                    onChange={(e) => setTxRemarks(e.target.value)}
                    placeholder="e.g. paid via riders cash desk"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary focus:bg-card"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="h-9 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-5 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-colors"
                  >
                    Post Transaction
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
