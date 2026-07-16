'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useBillingSystem } from '@/lib/context';
import { Customer, Payment, Complaint, Invoice, Package } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  HelpCircle,
  MapPin,
  Tag,
  Clock,
  Printer,
  ChevronDown,
  TrendingUp,
  Briefcase,
  Activity,
  Layers,
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
  LineChart,
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';
import Link from 'next/link';

type ReportType =
  | 'recovery'
  | 'customer'
  | 'outstanding'
  | 'complaint'
  | 'payment'
  | 'package'
  | 'daily_collection'
  | 'monthly_collection'
  | 'area_collection';

type DateFilterType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export default function ReportsPage() {
  const { customers, payments, complaints, invoices, packages } = useBillingSystem();

  // Redesign State
  const [reportType, setReportType] = useState<ReportType>('recovery');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [areaFilter, setAreaFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [packageFilter, setPackageFilter] = useState('All');
  const [connectionStatusFilter, setConnectionStatusFilter] = useState('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [recoveryStatusFilter, setRecoveryStatusFilter] = useState('All');

  // Reset package name filter when category changes
  useEffect(() => {
    setPackageFilter('All');
  }, [categoryFilter]);

  // Loading indicator for export simulation
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'PDF' | 'Excel' | 'CSV' | null>(null);

  // Extract unique areas and packages for filter options
  const uniqueAreas = useMemo(() => {
    return ['All', ...Array.from(new Set(customers.map((c) => c.area)))];
  }, [customers]);

  const uniquePackages = useMemo(() => {
    let filteredPkgs = packages;
    if (categoryFilter !== 'All') {
      filteredPkgs = packages.filter((p) => p.category === categoryFilter);
    }
    const names = Array.from(new Set(filteredPkgs.map((p) => p.name)));
    return ['All', ...names];
  }, [packages, categoryFilter]);

  // Helper: Date parser check
  const isWithinDateRange = (dateString: string) => {
    if (!dateString) return false;
    const targetDate = new Date(dateString.split(' ')[0]); // strip time if present
    const now = new Date();
    
    // Set hours to 0 to compare days properly
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    
    // This week: Monday to Sunday
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday);
    
    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    switch (dateFilter) {
      case 'today':
        return targetDate.toDateString() === startOfToday.toDateString();
      case 'yesterday':
        return targetDate.toDateString() === startOfYesterday.toDateString();
      case 'this_week':
        return targetDate >= startOfWeek && targetDate <= now;
      case 'this_month':
        return targetDate >= startOfMonth && targetDate <= now;
      case 'last_month':
        return targetDate >= startOfLastMonth && targetDate <= endOfLastMonth;
      case 'custom':
        const start = new Date(startDate);
        const end = new Date(endDate);
        // set end date to end of day
        end.setHours(23, 59, 59, 999);
        return targetDate >= start && targetDate <= end;
      default:
        return true;
    }
  };

  // Filtered Datasets based on Report Type & Selected Filters
  const filteredData = useMemo(() => {
    // 1. Recovery & Customer & Outstanding
    let clientResult = [...customers];
    
    // Apply filters
    if (areaFilter !== 'All') {
      clientResult = clientResult.filter(c => c.area === areaFilter);
    }
    if (categoryFilter !== 'All') {
      clientResult = clientResult.filter(c => {
        const pkg = packages.find(p => p.id === c.packageId || p.name === c.packageName);
        return pkg?.category === categoryFilter;
      });
    }
    if (packageFilter !== 'All') {
      clientResult = clientResult.filter(c => c.packageName === packageFilter);
    }
    if (connectionStatusFilter !== 'All') {
      clientResult = clientResult.filter(c => c.connectionStatus === connectionStatusFilter);
    }
    if (paymentStatusFilter !== 'All') {
      clientResult = clientResult.filter(c => c.paymentStatus === paymentStatusFilter);
    }
    if (recoveryStatusFilter !== 'All') {
      clientResult = clientResult.filter(c => {
        if (recoveryStatusFilter === 'Fully Recovered') return c.outstandingBalance === 0;
        if (recoveryStatusFilter === 'Partially Recovered') return c.outstandingBalance > 0 && c.paymentStatus === 'Pending';
        if (recoveryStatusFilter === 'No Recovery') return c.outstandingBalance > 0 && c.paymentStatus === 'Unpaid';
        return true;
      });
    }
    // Filter by Date joined
    clientResult = clientResult.filter(c => isWithinDateRange(c.connectionDate));

    // 2. Payments Result
    let paymentResult = [...payments];
    paymentResult = paymentResult.filter(p => {
      const cust = customers.find(c => c.id === p.customerId);
      if (areaFilter !== 'All' && cust?.area !== areaFilter) return false;
      if (categoryFilter !== 'All') {
        const pkg = packages.find(pkgObj => pkgObj.id === cust?.packageId || pkgObj.name === cust?.packageName);
        if (pkg?.category !== categoryFilter) return false;
      }
      if (packageFilter !== 'All' && cust?.packageName !== packageFilter) return false;
      return isWithinDateRange(p.paymentDate);
    });

    // 3. Complaints Result
    let complaintResult = [...complaints];
    complaintResult = complaintResult.filter(comp => {
      const cust = customers.find(c => c.id === comp.customerId);
      if (areaFilter !== 'All' && cust?.area !== areaFilter) return false;
      if (categoryFilter !== 'All') {
        const pkg = packages.find(pkgObj => pkgObj.id === cust?.packageId || pkgObj.name === cust?.packageName);
        if (pkg?.category !== categoryFilter) return false;
      }
      if (packageFilter !== 'All' && cust?.packageName !== packageFilter) return false;
      return isWithinDateRange(comp.dateCreated);
    });

    return {
      clients: clientResult,
      payments: paymentResult,
      complaints: complaintResult,
    };
  }, [customers, payments, complaints, dateFilter, startDate, endDate, areaFilter, categoryFilter, packageFilter, connectionStatusFilter, paymentStatusFilter, recoveryStatusFilter, packages]);

  // Export report handler
  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    setExportFormat(format);
    setIsExporting(true);

    setTimeout(() => {
      setIsExporting(false);
      
      if (format === 'PDF') {
        window.print();
        return;
      }

      // Generate CSV or Excel mock content
      let headers: string[] = [];
      let rows: any[][] = [];
      let filename = `FN_${reportType}_Report_${dateFilter}`;

      if (reportType === 'recovery') {
        headers = ['Client ID', 'Client Name', 'Area', 'Plan Rate', 'Paid Status', 'Remaining Balance'];
        rows = filteredData.clients.map(c => [c.id, c.name, c.area, c.monthlyCharges, c.paymentStatus, c.outstandingBalance]);
      } else if (reportType === 'customer') {
        headers = ['Client ID', 'Client Name', 'Mobile', 'Address', 'Area', 'Package Name', 'Monthly Charges', 'Joined Date', 'Status'];
        rows = filteredData.clients.map(c => [c.id, c.name, c.phone, c.address, c.area, c.packageName, c.monthlyCharges, c.connectionDate, c.connectionStatus]);
      } else if (reportType === 'outstanding') {
        headers = ['Client ID', 'Client Name', 'Mobile', 'Area', 'Plan Rate', 'Outstanding Debt'];
        rows = filteredData.clients.filter(c => c.outstandingBalance > 0).map(c => [c.id, c.name, c.phone, c.area, c.monthlyCharges, c.outstandingBalance]);
      } else if (reportType === 'complaint') {
        headers = ['Ticket No', 'Client Name', 'Mobile', 'Area', 'Category', 'Priority', 'Status', 'Date Opened', 'Engineer Notes'];
        rows = filteredData.complaints.map(t => [t.ticketNumber, t.customerName, t.mobileNumber || '', t.area || '', t.category || '', t.priority, t.status, t.dateCreated, t.engineerNotes || '']);
      } else if (reportType === 'payment') {
        headers = ['Receipt No', 'Customer Name', 'Amount Recv', 'Method', 'Ref No', 'Payment Date', 'Staff Agent'];
        rows = filteredData.payments.map(p => [p.id, p.customerName, p.amountReceived, p.paymentMethod, p.referenceNumber || 'N/A', p.paymentDate, p.receivedBy]);
      } else if (reportType === 'package') {
        headers = ['Package Name', 'Monthly Rate', 'Total Subscribers', 'Total Revenue'];
        headers = ['Package ID', 'Package Name', 'Speed', 'Charges', 'Status'];
        rows = packages.map(p => [p.id, p.name, p.speed, p.monthlyCharges, p.status]);
      } else if (reportType === 'daily_collection') {
        // Compute daily summary
        const dayMap = filteredData.payments.reduce((acc: Record<string, number>, p) => {
          const date = p.paymentDate.split(' ')[0];
          acc[date] = (acc[date] || 0) + p.amountReceived;
          return acc;
        }, {});
        headers = ['Date', 'Total Collections (PKR)'];
        rows = Object.entries(dayMap).map(([date, total]) => [date, total]);
      } else if (reportType === 'monthly_collection') {
        headers = ['Billing Month', 'Invoiced Amount', 'Received Payments', 'Recovery Ratio'];
        rows = [['July 2026', 16400, payments.reduce((sum, p) => sum + p.amountReceived, 0), 'Cleared']];
      } else if (reportType === 'area_collection') {
        const areaMap = filteredData.payments.reduce((acc: Record<string, number>, p) => {
          const cust = customers.find(c => c.id === p.customerId);
          const area = cust?.area || 'Unknown';
          acc[area] = (acc[area] || 0) + p.amountReceived;
          return acc;
        }, {});
        headers = ['Area Hub', 'Received Collections (PKR)'];
        rows = Object.entries(areaMap).map(([area, total]) => [area, total]);
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${filename}.${format === 'Excel' ? 'csv' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  // Recharts: Collection distribution for payment types
  const paymentMethodsDistribution = useMemo(() => {
    const counts = filteredData.payments.reduce((acc: Record<string, number>, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.amountReceived;
      return acc;
    }, {});
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
    return Object.entries(counts).map(([name, val], i) => ({
      name,
      value: val,
      color: colors[i % colors.length]
    }));
  }, [filteredData.payments]);

  // Recharts: Daily collections trend chart data
  const dailyTrendData = useMemo(() => {
    const dailyMap = filteredData.payments.reduce((acc: Record<string, number>, p) => {
      const day = p.paymentDate.split(' ')[0].substring(5); // MM-DD
      acc[day] = (acc[day] || 0) + p.amountReceived;
      return acc;
    }, {});
    return Object.entries(dailyMap).map(([day, val]) => ({
      day,
      Collected: val
    })).sort((a,b) => a.day.localeCompare(b.day));
  }, [filteredData.payments]);

  return (
    <div className="space-y-6">
      {isExporting && (
        <LogoLoader
          overlay
          text={`Generating ${exportFormat} Document...`}
          subtext="Friends Network ISP Billing Analytics Engine"
          loadingText="Aggregating records and compiling charts..."
        />
      )}

      {/* Header and Download Button (print:hidden) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Operational &amp; Financial Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Redesigned real-time report engine for Friends Network Broadband audits.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-sm self-stretch sm:self-auto justify-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Export:</span>
          <button
            onClick={() => handleExport('PDF')}
            className="flex h-8 items-center gap-1 rounded-lg hover:bg-slate-100 px-2.5 text-[11px] font-bold text-slate-600 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="flex h-8 items-center gap-1 rounded-lg hover:bg-slate-100 px-2.5 text-[11px] font-bold text-slate-600 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="flex h-8 items-center gap-1 rounded-lg hover:bg-slate-100 px-2.5 text-[11px] font-bold text-slate-600 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Workspace Layout */}
      <div className="grid gap-6 lg:grid-cols-4 items-start text-left">
        {/* Filters Sidebar Panel (print:hidden) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Filter className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-bold text-sm text-slate-850">Analytics Filters</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Report Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="recovery">Recovery Report</option>
                <option value="customer">Customer Report</option>
                <option value="outstanding">Outstanding Debt Report</option>
                <option value="complaint">Complaint Outage Report</option>
                <option value="payment">Collections Ledger Report</option>
                <option value="package">Package rate Report</option>
                <option value="daily_collection">Daily Collections Summary</option>
                <option value="monthly_collection">Monthly collections Ledger</option>
                <option value="area_collection">Area wise Collection report</option>
              </select>
            </div>

            {/* Date range filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Date Filter</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Dates (Enabled if Custom Date Range is selected) */}
            {dateFilter === 'custom' && (
              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">Start Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-border bg-secondary/30 px-2 text-xs outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">End Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-full rounded-xl border border-border bg-secondary/30 px-2 text-xs outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* Area Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Area Zone</label>
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                {uniqueAreas.map((area) => (
                  <option key={area} value={area}>
                    {area === 'All' ? 'All Areas' : area}
                  </option>
                ))}
              </select>
            </div>

            {/* Package Category Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Package Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Categories</option>
                <option value="Social Media">Social Media Packages</option>
                <option value="Standard">Standard Packages</option>
                <option value="Static IP">Static IP Packages</option>
              </select>
            </div>

            {/* Package Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Bandwidth Package</label>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                {uniquePackages.map((pkg) => (
                  <option key={pkg} value={pkg}>
                    {pkg === 'All' ? 'All Packages' : pkg}
                  </option>
                ))}
              </select>
            </div>

            {/* Connection Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Connection Status</label>
              <select
                value={connectionStatusFilter}
                onChange={(e) => setConnectionStatusFilter(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Connections</option>
                <option value="Active">Active Connections</option>
                <option value="Inactive">Suspended Connections</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Billing Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid Bills</option>
                <option value="Unpaid">Unpaid Bills</option>
                <option value="Pending">Pending Collections</option>
              </select>
            </div>

            {/* Recovery Status Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Recovery Ledger Status</label>
              <select
                value={recoveryStatusFilter}
                onChange={(e) => setRecoveryStatusFilter(e.target.value)}
                className="h-9.5 w-full rounded-xl border border-border bg-secondary/30 px-3 text-xs outline-none transition-all focus:border-primary focus:bg-card"
              >
                <option value="All">All Ledger Statuses</option>
                <option value="Fully Recovered">Fully Recovered (0 Bal)</option>
                <option value="Partially Recovered">Partially Recovered</option>
                <option value="No Recovery">No Recovery (Unpaid Debt)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Visuals & Data Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* Summary stats cards for current report */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <div className="bg-card border border-border p-4.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Filtered Clients</span>
              <p className="text-xl font-bold mt-1 text-primary">{filteredData.clients.length}</p>
            </div>
            <div className="bg-card border border-border p-4.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Filtered Receipts</span>
              <p className="text-xl font-bold mt-1 text-emerald-500">{filteredData.payments.length}</p>
            </div>
            <div className="bg-card border border-border p-4.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Filtered Outages</span>
              <p className="text-xl font-bold mt-1 text-rose-500">{filteredData.complaints.length}</p>
            </div>
            <div className="bg-card border border-border p-4.5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Filtered Debt</span>
              <p className="text-xl font-bold mt-1 text-amber-500">
                PKR {filteredData.clients.reduce((s, c) => s + c.outstandingBalance, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Charts Row */}
          {filteredData.payments.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Daily collections trend chart */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Daily Collection Trend</span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrendData} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={9} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }} />
                      <Line type="monotone" dataKey="Collected" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods Donut */}
              {paymentMethodsDistribution.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div className="w-1/2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Method collections</span>
                    <span className="text-xs text-muted-foreground block leading-normal">Billing collection breakdown</span>
                    <div className="mt-4 space-y-1.5 text-[10px] font-medium text-slate-500">
                      {paymentMethodsDistribution.map(entry => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="truncate">{entry.name}</span>
                          <span className="font-bold ml-auto text-slate-650">PKR {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-32 w-1/2 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentMethodsDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {paymentMethodsDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details Table view */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-border bg-slate-500/5 px-5 py-4">
              <h3 className="font-bold text-sm text-slate-800 capitalize flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-primary" />
                <span>{reportType.replace('_', ' ')} Result Log</span>
              </h3>
            </div>

            <div className="p-4">
              <div className="overflow-x-auto">
                {/* 1. Recovery Report */}
                {reportType === 'recovery' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Client ID</th>
                        <th className="p-3">Client Name</th>
                        <th className="p-3">Area Hub</th>
                        <th className="p-3">Plan Rate</th>
                        <th className="p-3">Paid Status</th>
                        <th className="p-3 text-right">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {filteredData.clients.map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-indigo-500">
                            <Link href={`/customers/${c.id}`} className="hover:underline">{c.id}</Link>
                          </td>
                          <td className="p-3 text-slate-800">
                            <Link href={`/customers/${c.id}`} className="hover:underline">{c.name}</Link>
                          </td>
                          <td className="p-3">{c.area}</td>
                          <td className="p-3">PKR {c.monthlyCharges}</td>
                          <td className="p-3">
                            <StatusBadge status={c.paymentStatus} />
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800">PKR {c.outstandingBalance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 2. Customer Report */}
                {reportType === 'customer' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">ID</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Area</th>
                        <th className="p-3">Address</th>
                        <th className="p-3">Connection Plan</th>
                        <th className="p-3">Joining Date</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {filteredData.clients.map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-indigo-500">
                            <Link href={`/customers/${c.id}`} className="hover:underline">{c.id}</Link>
                          </td>
                          <td className="p-3 text-slate-800">
                            <Link href={`/customers/${c.id}`} className="hover:underline">{c.name}</Link>
                          </td>
                          <td className="p-3">{c.phone}</td>
                          <td className="p-3">{c.area}</td>
                          <td className="p-3 max-w-[140px] truncate">{c.address}</td>
                          <td className="p-3">{c.packageName}</td>
                          <td className="p-3 text-muted-foreground">{c.connectionDate}</td>
                          <td className="p-3">
                            <StatusBadge status={c.connectionStatus} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 3. Outstanding Report */}
                {reportType === 'outstanding' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">ID</th>
                        <th className="p-3">Client Name</th>
                        <th className="p-3">Contact Number</th>
                        <th className="p-3">Billing Zone</th>
                        <th className="p-3">Plan Charge</th>
                        <th className="p-3 text-right">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {filteredData.clients.filter(c => c.outstandingBalance > 0).map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-indigo-500">
                            <Link href={`/customers/${c.id}`} className="hover:underline">{c.id}</Link>
                          </td>
                          <td className="p-3 text-slate-800">
                            <Link href={`/customers/${c.id}`} className="hover:underline">{c.name}</Link>
                          </td>
                          <td className="p-3">{c.phone}</td>
                          <td className="p-3">{c.area}</td>
                          <td className="p-3">PKR {c.monthlyCharges}</td>
                          <td className="p-3 text-right font-bold text-rose-500">PKR {c.outstandingBalance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 4. Complaint Report */}
                {reportType === 'complaint' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Ticket No</th>
                        <th className="p-3">Client Name</th>
                        <th className="p-3">Area</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Engineer</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Created Date</th>
                        <th className="p-3">Engineer Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {filteredData.complaints.map((comp) => (
                        <tr key={comp.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-indigo-500">{comp.ticketNumber}</td>
                          <td className="p-3 text-slate-850 font-bold">
                            <Link href={`/customers/${comp.customerId}`} className="hover:underline">{comp.customerName}</Link>
                          </td>
                          <td className="p-3">{comp.area || 'N/A'}</td>
                          <td className="p-3">{comp.category || 'Slow Speed'}</td>
                          <td className="p-3">
                            <StatusBadge status={comp.priority} />
                          </td>
                          <td className="p-3">{comp.assignedEngineer}</td>
                          <td className="p-3">
                            <StatusBadge status={comp.status} />
                          </td>
                          <td className="p-3 text-muted-foreground">{comp.dateCreated}</td>
                          <td className="p-3 max-w-[150px] truncate italic text-slate-400">{comp.engineerNotes || 'No notes'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 5. Payment Report */}
                {reportType === 'payment' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Receipt No</th>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3">Billing Month</th>
                        <th className="p-3">Amount Received</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Reference No</th>
                        <th className="p-3">Cleared Date</th>
                        <th className="p-3">Staff Desk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {filteredData.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-semibold text-emerald-600">{p.id}</td>
                          <td className="p-3 text-slate-800 font-bold">
                            <Link href={`/customers/${p.customerId}`} className="hover:underline">{p.customerName}</Link>
                          </td>
                          <td className="p-3 font-medium text-slate-600">{p.billingMonth}</td>
                          <td className="p-3 font-bold text-emerald-500">PKR {p.amountReceived}</td>
                          <td className="p-3">{p.paymentMethod}</td>
                          <td className="p-3 font-mono">{p.referenceNumber || 'N/A'}</td>
                          <td className="p-3 text-muted-foreground">{p.paymentDate}</td>
                          <td className="p-3">{p.receivedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 6. Package Report */}
                {reportType === 'package' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Package ID</th>
                        <th className="p-3">Package Name</th>
                        <th className="p-3">Bandwidth Speed</th>
                        <th className="p-3">Monthly Charge</th>
                        <th className="p-3">Active Subscribers</th>
                        <th className="p-3">Plan Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {packages.map((pkg) => {
                        const subscriberCount = customers.filter(c => c.packageName === pkg.name || c.packageId === pkg.id).length;
                        return (
                          <tr key={pkg.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 font-mono font-bold text-indigo-500">{pkg.id}</td>
                            <td className="p-3 font-bold text-slate-800">{pkg.name}</td>
                            <td className="p-3 font-semibold text-indigo-600">{pkg.speed}</td>
                            <td className="p-3 font-extrabold text-slate-800">PKR {pkg.monthlyCharges}</td>
                            <td className="p-3 text-slate-800 font-bold">{subscriberCount} Connections</td>
                            <td className="p-3">
                              <StatusBadge status={pkg.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* 7. Daily Collection */}
                {reportType === 'daily_collection' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Collection Date</th>
                        <th className="p-3">Payments Count</th>
                        <th className="p-3 text-right">Total Collection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {Object.entries(
                        filteredData.payments.reduce((acc: Record<string, { count: number; sum: number }>, p) => {
                          const date = p.paymentDate.split(' ')[0];
                          if (!acc[date]) acc[date] = { count: 0, sum: 0 };
                          acc[date].count += 1;
                          acc[date].sum += p.amountReceived;
                          return acc;
                        }, {})
                      ).map(([date, data]) => (
                        <tr key={date} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{date}</td>
                          <td className="p-3 font-semibold">{data.count} Payments</td>
                          <td className="p-3 text-right font-extrabold text-emerald-500">PKR {data.sum.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* 8. Monthly Collection */}
                {reportType === 'monthly_collection' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Billing Month</th>
                        <th className="p-3">Total Invoices Raised</th>
                        <th className="p-3">Total Payments Recorded</th>
                        <th className="p-3 text-right">Total Received Collection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {Object.entries(
                        invoices.reduce((acc: Record<string, { count: number; sum: number }>, inv) => {
                          const month = inv.billingMonth;
                          if (!acc[month]) acc[month] = { count: 0, sum: 0 };
                          acc[month].count += 1;
                          acc[month].sum += inv.grandTotal;
                          return acc;
                        }, {})
                      ).map(([month, data]) => {
                        const recvSum = payments
                          .filter(p => p.billingMonth === month)
                          .reduce((s, p) => s + p.amountReceived, 0);
                        return (
                          <tr key={month} className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{month}</td>
                            <td className="p-3 font-semibold">PKR {data.sum.toLocaleString()} ({data.count} bills)</td>
                            <td className="p-3 font-semibold">{payments.filter(p => p.billingMonth === month).length} Collections</td>
                            <td className="p-3 text-right font-extrabold text-emerald-500">PKR {recvSum.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* 9. Area Wise Collection */}
                {reportType === 'area_collection' && (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase font-bold">
                        <th className="p-3">Area Distribution Hub</th>
                        <th className="p-3">Subscribers Cleared</th>
                        <th className="p-3 text-right">Total Net Collection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-medium text-slate-600">
                      {Object.entries(
                        filteredData.payments.reduce((acc: Record<string, { count: number; sum: number }>, p) => {
                          const cust = customers.find(c => c.id === p.customerId);
                          const area = cust?.area || 'Unknown';
                          if (!acc[area]) acc[area] = { count: 0, sum: 0 };
                          acc[area].count += 1;
                          acc[area].sum += p.amountReceived;
                          return acc;
                        }, {})
                      ).map(([area, data]) => (
                        <tr key={area} className="hover:bg-secondary/20 transition-colors">
                          <td className="p-3 font-bold text-slate-850">{area}</td>
                          <td className="p-3 font-semibold">{data.count} collections</td>
                          <td className="p-3 text-right font-extrabold text-emerald-500">PKR {data.sum.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Beautiful Empty State */}
              {((reportType === 'recovery' || reportType === 'customer' || reportType === 'outstanding') && filteredData.clients.length === 0) ||
               (reportType === 'complaint' && filteredData.complaints.length === 0) ||
               (reportType === 'payment' && filteredData.payments.length === 0) ? (
                <div className="p-12 text-center text-slate-400">
                  <AlertTriangle className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-700">No matching analytics records</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Try adjusting your filters, selecting a different date range, or picking a different report category.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
