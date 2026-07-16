'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Brain,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AnalyticsData {
  recoveryRate: number;
  clv: number;
  churnRate: number;
  complaintHeatmap: { area: string; value: number }[];
  packageDemand: { packageName: string; subscribers: number }[];
}

export default function AIInsightsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadData = async () => {
    try {
      const [anRes, fcRes] = await Promise.all([
        api.get('/ai/analytics'),
        api.post('/ai/query', { query: 'predict monthly revenue forecast' })
      ]);
      setAnalytics(anRes.data);
      setForecast(fcRes.data.data || []);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadReport = async (reportType: string, format: string) => {
    setIsDownloading(true);
    try {
      // Post to generate
      const genRes = await api.post('/ai-reports/generate', {
        report_type: reportType,
        format: format
      });
      // Force download via browser by pointing directly to endpoint URL
      window.open(`${api.defaults.baseURL}/ai-reports/download?type=${encodeURIComponent(reportType)}&format=${format}`, '_blank');
    } catch (err) {
      alert('Report generation failed');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Generating AI predictive analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary animate-pulse" />
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">AI Executive Insights</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Analyze monthly recovery yields, customer lifetime values, predictive churn risks, and export reports.
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Grid: Overview cards */}
      {analytics && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Expected Recovery</span>
            <div className="text-3xl font-black text-emerald-500">{analytics.recoveryRate}%</div>
            <p className="text-[10px] text-muted-foreground">Historical billing collections ratio forecast.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Est. Customer Lifetime Value</span>
            <div className="text-3xl font-black text-indigo-500">{analytics.clv.toLocaleString()} PKR</div>
            <p className="text-[10px] text-muted-foreground">Expected revenue per customer account lifecycle.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Churn Risk Threshold</span>
            <div className="text-3xl font-black text-rose-500">{analytics.churnRate}%</div>
            <p className="text-[10px] text-muted-foreground">Subscribers with high outstanding unpaid cycles.</p>
          </div>
        </div>
      )}

      {/* Revenue Forecast Chart */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <span>6-Month Predictive Revenue Forecast Projection</span>
        </h3>
        <div className="h-64 w-full">
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} unit=" PKR" />
                <Tooltip formatter={(value) => `${(value ?? 0).toLocaleString()} PKR`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Expected Collections" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No revenue ledger values found to compute projection.
            </div>
          )}
        </div>
      </div>

      {/* Automated Reports Export */}
      <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>AI Operational Report Generator Console</span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          {['Daily Report', 'Weekly Report', 'Monthly Report'].map((rep) => (
            <div key={rep} className="p-4 rounded-xl border border-border bg-secondary/25 flex flex-col justify-between gap-3">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{rep}</span>
                <span className="text-muted-foreground block text-[10px] mt-0.5">
                  Includes recoveries, tickets, and attendance checks.
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadReport(rep, 'PDF')}
                  className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleDownloadReport(rep, 'Excel')}
                  className="flex-1 h-8 rounded-lg border border-border bg-card hover:bg-secondary text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
