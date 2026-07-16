'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Landmark,
  DollarSign,
  RefreshCw,
  TrendingUp,
  FileText,
  PieChart as LucidePieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

interface LedgerEntry {
  date: string;
  account: string;
  description: string;
  type: string;
  amount: number;
}

interface CashBookData {
  cashBalance: number;
  bankBalance: number;
  totalFunds: number;
  transactions: any[];
}

interface ProfitLossData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  expensesCategorized: { category: string; amount: number }[];
}

export default function FinancePage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [cashBook, setCashBook] = useState<CashBookData | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [ledgerRes, cbRes, plRes] = await Promise.all([
        api.get('/finance/ledger'),
        api.get('/finance/cashbook'),
        api.get('/finance/profit-loss')
      ]);
      setLedger(ledgerRes.data);
      setCashBook(cbRes.data);
      setProfitLoss(plRes.data);
    } catch (err) {
      console.error('Failed to load financial dashboards:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Generating balance sheets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            <span>Finance &amp; Accounts Ledger</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Standard double-entry book-keeping general ledger, cash/bank logs, and automated Profit &amp; Loss statements.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isRefreshing}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Ledger Accounts</span>
        </button>
      </div>

      {/* Overview Cards */}
      {profitLoss && cashBook && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Net profit margin yield</span>
            <div className="text-3xl font-black text-emerald-500">{profitLoss.netProfit.toLocaleString()} PKR</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              <span>Profit Margin: {profitLoss.profitMarginPercent}% of collections.</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Cash Box Allocation</span>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{cashBook.cashBalance.toLocaleString()} PKR</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Available physical currency in cash drawers.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Bank accounts Balance</span>
            <div className="text-3xl font-black text-slate-800 dark:text-white">{cashBook.bankBalance.toLocaleString()} PKR</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Disbursable funds in designated bank checkings.
            </p>
          </div>
        </div>
      )}

      {/* General Ledger & Cash Book Transactions */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Ledger Entries */}
        <div className="md:col-span-8 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Double-Entry General Ledger</span>
            </h3>
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Adjusted journal feeds</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-slate-500/5 text-xs text-muted-foreground border-b border-border sticky top-0 bg-card z-10">
                  <th className="p-3">Date</th>
                  <th className="p-3">Account Ledger</th>
                  <th className="p-3">Journal Narrative</th>
                  <th className="p-3 text-right">Debit / Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledger.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-secondary/10">
                    <td className="p-3 font-mono text-[11px]">{entry.date}</td>
                    <td className="p-3 font-semibold">{entry.account}</td>
                    <td className="p-3 text-slate-500 text-[11px]">{entry.description}</td>
                    <td className={`p-3 text-right font-bold ${
                      entry.type === 'Debit' ? 'text-rose-500' : 'text-emerald-500'
                    }`}>
                      {entry.type === 'Debit' ? 'Dr ' : 'Cr '} {entry.amount.toLocaleString()} PKR
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Pie breakdown */}
        <div className="md:col-span-4 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col h-[400px]">
          <h3 className="font-bold text-base flex items-center gap-2">
            <LucidePieChart className="h-5 w-5 text-primary" />
            <span>Operational Expenses Share</span>
          </h3>
          <div className="flex-1 flex items-center justify-center min-h-0">
            {profitLoss && profitLoss.expensesCategorized.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={profitLoss.expensesCategorized}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category"
                  >
                    {profitLoss.expensesCategorized.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value ?? 0).toLocaleString()} PKR`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-muted-foreground">No ledger expenses registered.</span>
            )}
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[120px] text-xs">
            {profitLoss?.expensesCategorized.map((e, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {e.category}
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{e.amount.toLocaleString()} PKR</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
