'use client';

import React, { useState, useMemo } from 'react';
import { useBillingSystem } from '@/lib/context';
import StatusBadge from '@/components/StatusBadge';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Users,
  UserX,
  CreditCard,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Link from 'next/link';

export default function ReportsPage() {
  const { customers, payments, invoices } = useBillingSystem();
  const [activeListTab, setActiveListTab] = useState<'payments' | 'outstanding' | 'new' | 'disconnected'>('payments');

  // Compute reports metrics
  const totalCollections = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amountReceived, 0);
  }, [payments]);

  const totalOutstanding = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  }, [customers]);

  const newCustomersThisMonth = useMemo(() => {
    // Mock check: connection dates in 2025/2026
    return customers.filter((c) => c.connectionDate.startsWith('2025') || c.connectionDate.startsWith('2026')).length;
  }, [customers]);

  const disconnectedUsers = useMemo(() => {
    return customers.filter((c) => c.connectionStatus === 'Inactive').length;
  }, [customers]);

  // Outstanding list sorted descending
  const outstandingList = useMemo(() => {
    return customers
      .filter((c) => c.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance);
  }, [customers]);

  // Disconnected list
  const disconnectedList = useMemo(() => {
    return customers.filter((c) => c.connectionStatus === 'Inactive');
  }, [customers]);

  // Area distribution data
  const areaDistribution = useMemo(() => {
    const counts = customers.reduce((acc: Record<string, number>, c) => {
      acc[c.area] = (acc[c.area] || 0) + 1;
      return acc;
    }, {});
    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];
    return Object.entries(counts).map(([name, count], i) => ({
      name,
      value: count,
      color: COLORS[i % COLORS.length],
    }));
  }, [customers]);

  // Monthly breakdown report chart
  const collectionVsOutstandingData = [
    { month: 'Feb', Collected: 29000, Outstanding: 15000 },
    { month: 'Mar', Collected: 35000, Outstanding: 12000 },
    { month: 'Apr', Collected: 39000, Outstanding: 11000 },
    { month: 'May', Collected: 42000, Outstanding: 14000 },
    { month: 'Jun', Collected: 41000, Outstanding: 16000 },
    { month: 'Jul', Collected: totalCollections, Outstanding: totalOutstanding },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Ledger Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reconcile collections, track outstanding debt balances, and analyze subscriber statistics.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Total Collections</span>
            <h3 className="text-2xl font-black mt-1 text-emerald-500">PKR {totalCollections.toLocaleString()}</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Accumulated receipts cleared</span>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Outstanding Debt</span>
            <h3 className="text-2xl font-black mt-1 text-rose-500">PKR {totalOutstanding.toLocaleString()}</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Unpaid billing invoices</span>
          </div>
          <div className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">New Activations</span>
            <h3 className="text-2xl font-black mt-1 text-primary">{newCustomersThisMonth} Accounts</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Registered fiber subscribers</span>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase">Disconnected Accounts</span>
            <h3 className="text-2xl font-black mt-1 text-rose-400">{disconnectedUsers} Accounts</h3>
            <span className="text-[10px] text-muted-foreground mt-1 block">Suspended line activations</span>
          </div>
          <div className="rounded-xl bg-rose-400/10 p-3 text-rose-400">
            <UserX className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Col vs Outstanding Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Collections vs Outstanding</h3>
              <p className="text-xs text-muted-foreground">Monthly cleared receipts vs remaining debts</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-500" /> Collected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-rose-400" /> Outstanding
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionVsOutstandingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Outstanding" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Share Donut Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Zone Subscriptions</h3>
            <p className="text-xs text-muted-foreground">Proportion of clients by area hubs</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={areaDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {areaDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold">{customers.length}</span>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase">Total Zone Users</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border pt-3">
            {areaDistribution.slice(0, 4).map((area) => (
              <div key={area.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: area.color }} />
                <span className="text-muted-foreground truncate">{area.name}</span>
                <span className="font-bold ml-auto">{area.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabbed Report Listings */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation tabs */}
        <div className="flex border-b border-border bg-secondary/15 p-1">
          <button
            onClick={() => setActiveListTab('payments')}
            className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-semibold transition-all ${
              activeListTab === 'payments'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Collections Log ({payments.length})
          </button>
          <button
            onClick={() => setActiveListTab('outstanding')}
            className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-semibold transition-all ${
              activeListTab === 'outstanding'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Outstanding Debtors ({outstandingList.length})
          </button>
          <button
            onClick={() => setActiveListTab('new')}
            className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-semibold transition-all ${
              activeListTab === 'new'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            New Signups ({newCustomersThisMonth})
          </button>
          <button
            onClick={() => setActiveListTab('disconnected')}
            className={`flex-1 sm:flex-none py-2.5 px-5 rounded-xl text-xs font-semibold transition-all ${
              activeListTab === 'disconnected'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Disconnected List ({disconnectedList.length})
          </button>
        </div>

        {/* Tab contents */}
        <div className="p-5">
          {activeListTab === 'payments' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="p-3">Receipt ID</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Reference No</th>
                    <th className="p-3">Billing Month</th>
                    <th className="p-3">Cleared Date</th>
                    <th className="p-3 text-right">Cleared Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/20">
                      <td className="p-3 font-semibold text-emerald-600">{p.id}</td>
                      <td className="p-3 font-medium text-foreground">{p.customerName}</td>
                      <td className="p-3">{p.paymentMethod}</td>
                      <td className="p-3 font-mono">{p.referenceNumber || 'N/A'}</td>
                      <td className="p-3">{p.billingMonth}</td>
                      <td className="p-3 text-muted-foreground">{p.paymentDate}</td>
                      <td className="p-3 text-right font-bold text-emerald-500">PKR {p.amountReceived}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeListTab === 'outstanding' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="p-3">Client ID</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Billing Zone</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3 text-right">Outstanding Debt</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {outstandingList.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/20">
                      <td className="p-3 font-semibold text-indigo-500">{c.id}</td>
                      <td className="p-3 font-medium text-foreground">{c.name}</td>
                      <td className="p-3">{c.area}</td>
                      <td className="p-3">{c.phone}</td>
                      <td className="p-3">
                        <StatusBadge status={c.paymentStatus} />
                      </td>
                      <td className="p-3 text-right font-bold text-rose-500">PKR {c.outstandingBalance}</td>
                      <td className="p-3 text-center">
                        <Link
                          href={`/payments?customerId=${c.id}`}
                          className="text-[10px] font-bold text-primary hover:underline"
                        >
                          Collect Payment
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeListTab === 'new' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="p-3">Client ID</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Service Plan</th>
                    <th className="p-3">Activation Date</th>
                    <th className="p-3">Mobile Contact</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers
                    .filter((c) => c.connectionDate.startsWith('2025') || c.connectionDate.startsWith('2026'))
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/20">
                        <td className="p-3 font-semibold text-indigo-500">{c.id}</td>
                        <td className="p-3 font-medium text-foreground">{c.name}</td>
                        <td className="p-3">{c.packageName}</td>
                        <td className="p-3 text-muted-foreground">{c.connectionDate}</td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3">
                          <StatusBadge status={c.connectionStatus} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {activeListTab === 'disconnected' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-semibold">
                    <th className="p-3">Client ID</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Billing Zone</th>
                    <th className="p-3">Plan Subscription</th>
                    <th className="p-3 text-right">Outstanding Debt</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {disconnectedList.map((c) => (
                    <tr key={c.id} className="hover:bg-secondary/20">
                      <td className="p-3 font-semibold text-indigo-500">{c.id}</td>
                      <td className="p-3 font-medium text-foreground">{c.name}</td>
                      <td className="p-3">{c.area}</td>
                      <td className="p-3">{c.packageName}</td>
                      <td className="p-3 text-right font-bold text-rose-500">PKR {c.outstandingBalance}</td>
                      <td className="p-3">
                        <StatusBadge status={c.connectionStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
