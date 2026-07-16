'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  Wrench,
  Users,
  AlertTriangle,
  RefreshCw,
  LineChart as LucideLineChart,
  BarChart,
  UserCheck,
  Shield,
  Activity,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface AnalyticsData {
  recoveryRate: number;
  clv: number;
  churnRate: number;
  complaintHeatmap: { area: string; value: number }[];
  packageDemand: { packageName: string; subscribers: number }[];
  technicianEfficiency: { name: string; completedJobs: number; avgResolutionTime: number }[];
  riskyCustomers: any[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/ai/analytics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Loading analytical charts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Business Analytics &amp; Predictions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Machine learning predictions, revenue forecasts, churn modeling, and technician optimization reports.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={isRefreshing}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Overview Cards */}
      {data && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Recovery Ratio Yield</span>
              <Activity className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{data.recoveryRate}%</span>
              <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>+2.4% vs last mo</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Percentage of monthly generated invoices successfully collected within the billing period.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Customer Lifetime Value (CLV)</span>
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{data.clv.toLocaleString()} PKR</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Forecasted total revenue contribution per customer based on package tier and retention metrics.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Projected Churn Risk</span>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black">{data.churnRate}%</span>
              {data.churnRate > 15 ? (
                <span className="text-xs font-semibold text-rose-500 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  <span>Critical Risk Threshold</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-500 flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" />
                  <span>Stable retention</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Model prediction of active subscribers likely to churn due to outstanding bill cycles.
            </p>
          </div>
        </div>
      )}

      {/* Complaint Heatmap and Package Demand */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Heatmap */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5">
              <LucideLineChart className="h-5 w-5 text-primary" />
              <span>Complaint Heatmap by Distribution Area</span>
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={data.complaintHeatmap}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="area" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 9 }} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Package Demand */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5">
              <BarChart className="h-5 w-5 text-primary" />
              <span>Package Subscription Demand Share</span>
            </h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.packageDemand}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="subscribers"
                    nameKey="packageName"
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {data.packageDemand.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Technician Efficiency and Churn Risks */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Tech Efficiency */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5">
              <Wrench className="h-5 w-5 text-primary" />
              <span>Technician Efficiency &amp; Resolution Performance</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-500/5 font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="p-3">Technician Name</th>
                    <th className="p-3 text-center">Completed Tickets</th>
                    <th className="p-3 text-right">Avg Resolution Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.technicianEfficiency.map((tech, idx) => (
                    <tr key={idx} className="hover:bg-slate-500/[0.01]">
                      <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{tech.name}</td>
                      <td className="p-3 text-center font-bold text-indigo-500">{tech.completedJobs}</td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                        {tech.avgResolutionTime} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Risky Customers Churn list */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5 text-rose-500">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span>Critical At-Risk Subscriber Profiles</span>
            </h3>
            <div className="max-h-[220px] overflow-y-auto space-y-3">
              {data.riskyCustomers.map((cust) => (
                <div key={cust.customerId} className="p-3 rounded-xl border border-border bg-rose-500/[0.02] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{cust.name} ({cust.customerId})</span>
                    <span className="text-muted-foreground block mt-0.5 font-semibold text-[10px]">
                      {cust.reasons.join(' | ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[10px] block w-fit ml-auto mb-1">
                      {cust.riskLevel} Risk
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block">{cust.outstandingBalance} PKR outstanding</span>
                  </div>
                </div>
              ))}
              {data.riskyCustomers.length === 0 && (
                <div className="text-center p-6 text-muted-foreground text-xs font-semibold">
                  No critical churn risks detected in this billing ledger cycle.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
