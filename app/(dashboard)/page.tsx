'use client';

import React, { useState, useEffect } from 'react';
import { useBillingSystem } from '@/lib/context';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import {
  Users,
  UserCheck,
  UserMinus,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  MessageSquarePlus,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export default function DashboardPage() {
  const { customers, invoices, payments, complaints, packages } = useBillingSystem();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute stats dynamically
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.connectionStatus === 'Active').length;
  const inactiveCustomers = customers.filter((c) => c.connectionStatus === 'Inactive').length;
  
  const paidCustomers = customers.filter((c) => c.paymentStatus === 'Paid').length;
  const unpaidCustomers = customers.filter((c) => c.paymentStatus === 'Unpaid').length;
  const pendingCustomers = customers.filter((c) => c.paymentStatus === 'Pending').length;

  const monthlyRevenue = customers
    .filter((c) => c.connectionStatus === 'Active')
    .reduce((sum, c) => sum + c.monthlyCharges, 0);

  const todayCollection = payments.reduce((sum, p) => sum + p.amountReceived, 0);
  
  const pendingAmount = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Recent Payments
  const recentPayments = payments.slice(0, 5);
  // New Customers
  const newCustomers = customers.slice(0, 5);

  // Latest Activities based on timeline logs
  const latestActivities = customers
    .flatMap((c) => c.timeline.map((t) => ({ ...t, customerName: c.name, customerId: c.id })))
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);

  // Chart Data: Revenue Trend
  const revenueChartData = [
    { name: 'Feb', revenue: 32000, collections: 29000 },
    { name: 'Mar', revenue: 38000, collections: 35000 },
    { name: 'Apr', revenue: 41000, collections: 39000 },
    { name: 'May', revenue: 45000, collections: 42000 },
    { name: 'Jun', revenue: 48000, collections: 41000 },
    { name: 'Jul', revenue: monthlyRevenue, collections: todayCollection },
  ];

  // Chart Data: Package Distribution
  const packageCounts = customers.reduce((acc: Record<string, number>, c) => {
    acc[c.packageName] = (acc[c.packageName] || 0) + 1;
    return acc;
  }, {});

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  const packageChartData = Object.entries(packageCounts).map(([name, count]) => ({
    name: name.split(' - ')[1] || name, // simplify name
    value: count,
  }));

  // Chart Data: Collection Breakdown
  const collectionData = [
    { name: 'Cash', value: payments.filter((p) => p.paymentMethod === 'Cash').reduce((s, p) => s + p.amountReceived, 0) },
    { name: 'Bank Transfer', value: payments.filter((p) => p.paymentMethod === 'Bank').reduce((s, p) => s + p.amountReceived, 0) },
    { name: 'JazzCash', value: payments.filter((p) => p.paymentMethod === 'JazzCash').reduce((s, p) => s + p.amountReceived, 0) },
    { name: 'EasyPaisa', value: payments.filter((p) => p.paymentMethod === 'EasyPaisa').reduce((s, p) => s + p.amountReceived, 0) },
  ];

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            src="/friends-logo.png" 
            alt="Friends Network Logo" 
            className="h-16 w-16 object-contain" 
          />
          <div className="text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-1">
              Real-time analytics and billing stats for Friends Network.
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
          Status Check: <span className="font-semibold text-emerald-500">All systems online</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          change={8.4}
          subtext="from last month"
          gradient="from-indigo-500/5 to-blue-500/5"
        />
        <StatCard
          title="Active Connections"
          value={activeCustomers}
          icon={UserCheck}
          change={6.2}
          subtext="active status"
          gradient="from-emerald-500/5 to-teal-500/5"
        />
        <StatCard
          title="Monthly Projected Revenue"
          value={`PKR ${monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          change={12.5}
          subtext="active user billing"
          gradient="from-indigo-500/5 to-purple-500/5"
        />
        <StatCard
          title="Pending Collections"
          value={`PKR ${pendingAmount.toLocaleString()}`}
          icon={DollarSign}
          change={-2.4}
          changeType="negative"
          subtext="unpaid billing outstanding"
          gradient="from-amber-500/5 to-orange-500/5"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Today&apos;s Payments</span>
          <span className="text-xl font-bold mt-2 text-indigo-500">PKR {todayCollection.toLocaleString()}</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Unpaid Accounts</span>
          <span className="text-xl font-bold mt-2 text-rose-500">{unpaidCustomers} Accounts</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Inactive connections</span>
          <span className="text-xl font-bold mt-2 text-rose-400">{inactiveCustomers} Connections</span>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-muted-foreground">Paid Status Ratio</span>
          <span className="text-xl font-bold mt-2 text-emerald-500">
            {totalCustomers > 0 ? Math.round((paidCustomers / totalCustomers) * 100) : 0}% Paid
          </span>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue & Collection Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Revenue & Collections</h3>
              <p className="text-xs text-muted-foreground">Projected Revenue vs actual payments</p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-indigo-500" /> Projected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-400" /> Collected
              </span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorColl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="collections" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorColl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Distribution Chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Package Distribution</h3>
            <p className="text-xs text-muted-foreground">Market share of active bandwidth packages</p>
          </div>
          <div className="h-64 w-full relative flex items-center justify-center">
            {packageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={packageChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {packageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-muted-foreground">No package data available</span>
            )}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{totalCustomers}</span>
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Total Users</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {packageChartData.slice(0, 4).map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{entry.name}</span>
                <span className="font-semibold ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Tables Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Administrative workflow shortcuts</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Link
              href="/customers/add"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-primary/5 hover:border-primary/20 transition-all group"
            >
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 group-hover:scale-105 transition-transform">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold">Register New Customer</h4>
                <p className="text-xs text-muted-foreground">Set up account and GPON ONU details</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/billing"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-indigo-500/5 hover:border-primary/20 transition-all group"
            >
              <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-500 group-hover:scale-105 transition-transform">
                <Receipt className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold">Generate Monthly Bill</h4>
                <p className="text-xs text-muted-foreground">Create recurring internet invoices</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/payments"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group"
            >
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500 group-hover:scale-105 transition-transform">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold">Collect Bill Payment</h4>
                <p className="text-xs text-muted-foreground">Record EasyPaisa, Cash, or Bank receipts</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              href="/complaints"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-rose-500/5 hover:border-rose-500/20 transition-all group"
            >
              <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500 group-hover:scale-105 transition-transform">
                <MessageSquarePlus className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-semibold">File Outage Complaint</h4>
                <p className="text-xs text-muted-foreground">Assign support engineer to optical line tickets</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>

        {/* Recent Payments & New Customers lists */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm grid gap-6 md:grid-cols-2">
          {/* Recent Payments */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold">Recent Payments</h3>
              <Link href="/payments" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{p.customerName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.paymentMethod} • Ref: {p.referenceNumber || 'N/A'}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-500">+PKR {p.amountReceived}</span>
                </div>
              ))}
            </div>
          </div>

          {/* New Customers */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold">New Registrations</h3>
              <Link href="/customers" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {newCustomers.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{c.packageName.split(' - ')[1] || c.packageName} • {c.area}</p>
                  </div>
                  <StatusBadge status={c.connectionStatus} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Activity Logs */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold">Latest System Logs</h3>
          <p className="text-xs text-muted-foreground">Recent changes and audit logs</p>
        </div>
        <div className="space-y-3">
          {latestActivities.map((act, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-secondary/30 transition-colors">
              <div className="mt-0.5">
                <AlertCircle className={`h-4.5 w-4.5 ${
                  act.type === 'success' ? 'text-emerald-500' :
                  act.type === 'error' ? 'text-rose-500' :
                  act.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-foreground">
                    {act.title} — <span className="text-muted-foreground font-normal">{act.customerName} ({act.customerId})</span>
                  </p>
                  <span className="text-[10px] text-muted-foreground">{act.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-normal">{act.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
