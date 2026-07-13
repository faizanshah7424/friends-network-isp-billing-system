'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Bell,
  CheckCircle,
  MapPin,
  Phone,
  Wrench,
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
  Cell,
  BarChart,
  Bar,
  PieChart,
  Pie,
} from 'recharts';

export default function DashboardPage() {
  const { customers, payments, complaints, currentUser } = useBillingSystem();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSubAdmin = currentUser.role === 'Sub Admin';

  // Compute stats dynamically
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.connectionStatus === 'Active').length;
  const inactiveCustomers = customers.filter((c) => c.connectionStatus === 'Inactive').length;
  
  const paidCustomers = customers.filter((c) => c.paymentStatus === 'Paid').length;
  const unpaidCustomers = customers.filter((c) => c.paymentStatus === 'Unpaid').length;
  
  const monthlyRevenue = customers
    .filter((c) => c.connectionStatus === 'Active')
    .reduce((sum, c) => sum + c.monthlyCharges, 0);

  const todayCollection = payments.reduce((sum, p) => sum + p.amountReceived, 0);
  const pendingAmount = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // Sub Admin Recovery Calculations
  const pendingRecoveryCount = useMemo(() => {
    return customers.filter((c) => c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending').length;
  }, [customers]);

  const totalOutstandingAmount = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
  }, [customers]);

  const dueTodayCount = useMemo(() => {
    // Dynamic mock slice of pending list
    return Math.max(1, Math.min(3, pendingRecoveryCount - 1));
  }, [pendingRecoveryCount]);

  const dueTodayAmount = useMemo(() => {
    return dueTodayCount * 2200;
  }, [dueTodayCount]);

  const dueThisWeekCount = useMemo(() => {
    return Math.min(pendingRecoveryCount, dueTodayCount + 2);
  }, [pendingRecoveryCount, dueTodayCount]);

  const dueThisWeekAmount = useMemo(() => {
    return dueThisWeekCount * 2500;
  }, [dueThisWeekCount]);

  const complaintsAssigned = useMemo(() => {
    return complaints.filter(
      (c) => c.assignedEngineer === 'Noor Jamal' || c.assignedEngineer === currentUser.name
    ).length;
  }, [complaints, currentUser.name]);

  const pendingComplaintsCount = useMemo(() => {
    return complaints.filter((c) => c.status === 'Pending').length;
  }, [complaints]);

  const inProgressComplaintsCount = useMemo(() => {
    return complaints.filter((c) => c.status === 'In Progress').length;
  }, [complaints]);

  const resolvedTodayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return complaints.filter(
      (c) => c.status === 'Resolved' && (c.resolvedDate === today || c.dateCreated === today)
    ).length || 1;
  }, [complaints]);

  // General metrics for lists
  const recentPayments = payments.slice(0, 5);
  const newCustomers = customers.slice(0, 5);

  const latestActivities = useMemo(() => {
    return customers
      .flatMap((c) => c.timeline.map((t) => ({ ...t, customerName: c.name, customerId: c.id })))
      .sort((a, b) => b.id.localeCompare(a.id))
      .slice(0, 5);
  }, [customers]);

  // Chart Data: Revenue Trend (Super Admin Only)
  const revenueChartData = [
    { name: 'Feb', revenue: 32000, collections: 29000 },
    { name: 'Mar', revenue: 38000, collections: 35000 },
    { name: 'Apr', revenue: 41000, collections: 39000 },
    { name: 'May', revenue: 45000, collections: 42000 },
    { name: 'Jun', revenue: 48000, collections: 41000 },
    { name: 'Jul', revenue: monthlyRevenue, collections: todayCollection },
  ];

  // Chart Data: Package Distribution (Super Admin Only)
  const packageChartData = useMemo(() => {
    const packageCounts = customers.reduce((acc: Record<string, number>, c) => {
      acc[c.packageName] = (acc[c.packageName] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(packageCounts).map(([name, count]) => ({
      name: name.split(' - ')[1] || name, // simplify name
      value: count,
    }));
  }, [customers]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div className="flex items-center gap-3">
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            src="/friends-logo.png" 
            alt="Friends Network Logo" 
            className="h-16 w-16 object-contain" 
          />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              {isSubAdmin ? 'Recovery & Complaint Desk' : 'Dashboard Overview'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <span className="font-semibold text-slate-700">{currentUser.name}</span>. 
              {isSubAdmin 
                ? ' Dedicated recovery collections & active support tickets management terminal.' 
                : ' Real-time financial & operational status for Friends Network.'}
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-xl border border-border">
          Scope: <span className="font-semibold text-primary">{currentUser.role}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isSubAdmin ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Pending Recovery Customers"
            value={`${pendingRecoveryCount} Users`}
            icon={Users}
            change={4.8}
            subtext="with outstanding balance"
            gradient="from-rose-500/5 to-red-500/5"
          />
          <StatCard
            title="Total Outstanding Amount"
            value={`PKR ${totalOutstandingAmount.toLocaleString()}`}
            icon={DollarSign}
            change={1.2}
            subtext="ledger total outstanding"
            gradient="from-indigo-500/5 to-blue-500/5"
          />
          <StatCard
            title="Due Today"
            value={`${dueTodayCount} Accounts`}
            icon={Receipt}
            change={0}
            subtext={`PKR ${dueTodayAmount.toLocaleString()}`}
            gradient="from-amber-500/5 to-yellow-500/5"
          />
          <StatCard
            title="Due This Week"
            value={`${dueThisWeekCount} Accounts`}
            icon={CreditCard}
            change={0}
            subtext={`PKR ${dueThisWeekAmount.toLocaleString()}`}
            gradient="from-orange-500/5 to-amber-500/5"
          />
          <StatCard
            title="Assigned Complaints"
            value={complaintsAssigned}
            icon={ShieldCheck}
            change={0}
            subtext="assigned to you"
            gradient="from-indigo-500/5 to-purple-500/5"
          />
          <StatCard
            title="Pending Complaints"
            value={pendingComplaintsCount}
            icon={AlertCircle}
            change={-4.5}
            changeType="negative"
            subtext="unresolved field tickets"
            gradient="from-rose-500/5 to-pink-500/5"
          />
          <StatCard
            title="In Progress Complaints"
            value={inProgressComplaintsCount}
            icon={Wrench}
            change={12.0}
            subtext="currently repairing"
            gradient="from-amber-500/5 to-yellow-500/5"
          />
          <StatCard
            title="Resolved Today"
            value={resolvedTodayCount}
            icon={CheckCircle}
            change={8.4}
            subtext="tickets resolved today"
            gradient="from-emerald-500/5 to-teal-500/5"
          />
        </div>
      ) : (
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
      )}

      {/* Main Workspace split for Sub Admin (Recovery + Tickets) vs Charts for Super Admin */}
      {isSubAdmin ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recovery List */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-left">
            <div>
              <h3 className="font-bold text-base">Unpaid Recovery Accounts</h3>
              <p className="text-xs text-muted-foreground">Subscribers requiring payment collections</p>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {customers
                .filter((c) => c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending')
                .map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-border hover:bg-secondary/30 transition-colors flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <Link href={`/customers/${c.id}`} className="text-xs font-bold text-foreground hover:underline hover:text-primary transition-colors block truncate">
                        {c.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">{c.id} • {c.phone}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 truncate">
                        <MapPin className="h-3 w-3" />
                        <span>{c.address}</span>
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <span className="text-xs font-black text-rose-500 block">PKR {c.outstandingBalance}</span>
                      <Link href={`/payments?customerId=${c.id}`} className="text-[10px] text-primary font-bold hover:underline inline-block mt-2">
                        Collect Payment &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              {customers.filter((c) => c.paymentStatus === 'Unpaid' || c.paymentStatus === 'Pending').length === 0 && (
                <div className="text-center p-12 text-xs text-muted-foreground">
                  All accounts are paid! Great recovery work!
                </div>
              )}
            </div>
          </div>

          {/* Support Tickets */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-left">
            <div>
              <h3 className="font-bold text-base">Assigned Outage Tickets</h3>
              <p className="text-xs text-muted-foreground">Support complaints assigned to your dashboard</p>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {complaints
                .filter((comp) => comp.assignedEngineer === 'Noor Jamal' || comp.assignedEngineer === currentUser.name)
                .map((comp) => (
                  <div key={comp.id} className="p-3.5 rounded-xl border border-border hover:bg-secondary/30 transition-colors flex justify-between items-center">
                    <div className="min-w-0 flex-1">
                      <Link href="/complaints" className="text-xs font-bold text-foreground hover:underline hover:text-primary transition-colors block truncate">
                        {comp.customerName}
                      </Link>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">{comp.ticketNumber} • {comp.category || 'Outage'}</p>
                      <p className="text-[10px] text-rose-500 font-medium truncate mt-1 leading-normal">
                        &ldquo;{comp.issue}&rdquo;
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0 items-end ml-2">
                      <StatusBadge status={comp.priority} />
                      <StatusBadge status={comp.status} />
                    </div>
                  </div>
                ))}
              {complaints.filter((comp) => comp.assignedEngineer === 'Noor Jamal' || comp.assignedEngineer === currentUser.name).length === 0 && (
                <div className="text-center p-12 text-xs text-muted-foreground">
                  No tickets currently assigned to you.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Layout */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm text-left">
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
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between text-left">
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
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-left">
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
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm grid gap-6 md:grid-cols-2 text-left">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold">Recent Payments</h3>
                  <Link href="/payments" className="text-xs text-primary hover:underline">View All</Link>
                </div>
                <div className="space-y-3">
                  {recentPayments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                      <div>
                        <Link href={`/customers/${p.customerId}`} className="text-xs font-semibold text-foreground hover:underline hover:text-primary transition-colors block">
                          {p.customerName}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.paymentMethod} • Ref: {p.referenceNumber || 'N/A'}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-500">+PKR {p.amountReceived}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Customers */}
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold">New Registrations</h3>
                  <Link href="/customers" className="text-xs text-primary hover:underline">View All</Link>
                </div>
                <div className="space-y-3">
                  {newCustomers.map((c) => (
                    <div key={c.id} className="flex justify-between items-center p-3 rounded-xl border border-border hover:bg-secondary/40 transition-colors">
                      <div>
                        <Link href={`/customers/${c.id}`} className="text-xs font-semibold text-foreground hover:underline hover:text-primary transition-colors block">
                          {c.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{c.id} • {c.area}</p>
                      </div>
                      <StatusBadge status={c.connectionStatus} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Latest Activity Logs (Super Admin Only) */}
      {!isSubAdmin && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 text-left">
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
                      {act.title} — <Link href={`/customers/${act.customerId}`} className="text-indigo-500 hover:underline font-semibold">{act.customerName} ({act.customerId})</Link>
                    </p>
                    <span className="text-[10px] text-muted-foreground">{act.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
