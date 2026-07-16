'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Building,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  DollarSign,
  Cpu,
  RefreshCw,
  Edit,
  Shield,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ISP {
  id: string;
  name: string;
  domain: string;
  subscriptionPlan: string;
  status: string;
  customersCount: number;
  revenue: number;
  activated: boolean;
  expiry: string;
}

interface ServerHealth {
  cpuPercent: number;
  ramPercent: number;
  diskFreeGb: number;
  status: string;
}

interface PlatformDashboardData {
  totalIsps: number;
  totalCustomers: number;
  totalRevenue: number;
  totalActiveRouters: number;
  totalTechnicians: number;
  activeLicenses: number;
  serverHealth: ServerHealth;
  apiUsageCalls: number;
  isps: ISP[];
}

export default function TenantsPage() {
  const [data, setData] = useState<PlatformDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIspName, setNewIspName] = useState('');
  const [newIspDomain, setNewIspDomain] = useState('');
  const [newIspPlan, setNewIspPlan] = useState('Starter');
  const [newIspCustomerLimit, setNewIspCustomerLimit] = useState(100);
  const [newIspStorageLimit, setNewIspStorageLimit] = useState(1000);
  const [newIspTimezone, setNewIspTimezone] = useState('UTC');
  const [newIspCurrency, setNewIspCurrency] = useState('PKR');

  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/platform/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load platform dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateISP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants/', {
        name: newIspName,
        domain: newIspDomain,
        subscriptionPlan: newIspPlan,
        customerLimit: newIspCustomerLimit,
        storageLimit: newIspStorageLimit,
        timezone: newIspTimezone,
        currency: newIspCurrency
      });
      setShowCreateModal(false);
      // Reset form
      setNewIspName('');
      setNewIspDomain('');
      setNewIspPlan('Starter');
      setNewIspCustomerLimit(100);
      setNewIspStorageLimit(1000);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create ISP tenant');
    }
  };

  const handleToggleActivation = async (id: string, active: boolean) => {
    try {
      const endpoint = active ? `/tenants/${id}/suspend` : `/tenants/${id}/activate`;
      await api.post(endpoint);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Action failed');
    }
  };

  const handleDeleteTenant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant and all associated data permanently?')) return;
    try {
      await api.delete(`/tenants/${id}`);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Loading platform configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Platform Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Global SaaS dashboard to monitor and manage tenant ISPs, subscription quotas, custom domains, and platform system health.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Metrics</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Register ISP</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {data && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Total ISPs</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{data.totalIsps}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Total Customers</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{data.totalCustomers}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/10">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Global Revenue</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{data.totalRevenue.toLocaleString()} PKR</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/10">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Active Licenses</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">{data.activeLicenses}</span>
            </div>
          </div>
        </div>
      )}

      {/* System Health Section */}
      {data && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2 mb-5">
            <Cpu className="h-5 w-5 text-primary" />
            <span>Platform Server & Infrastructure Diagnostics</span>
          </h3>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">CPU Utilization</span>
                <span>{data.serverHealth.cpuPercent}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.serverHealth.cpuPercent}%` }} />
              </div>
            </div>
            {/* RAM */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">RAM Allocation</span>
                <span>{data.serverHealth.ramPercent}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${data.serverHealth.ramPercent}%` }} />
              </div>
            </div>
            {/* API Calls */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Rolling API Engine Calls</span>
                <span>{data.apiUsageCalls.toLocaleString()} calls</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISPs List */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base">Registered Internet Service Providers</h3>
          <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg">
            {data?.isps.length} ISPs Configured
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-500/5 text-xs text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                <th className="px-6 py-3.5">ISP Name</th>
                <th className="px-6 py-3.5">Domain</th>
                <th className="px-6 py-3.5">Plan</th>
                <th className="px-6 py-3.5">Active Subscribers</th>
                <th className="px-6 py-3.5">Revenue Collection</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs md:text-sm">
              {data?.isps.map((isp) => (
                <tr key={isp.id} className="hover:bg-slate-500/[0.01] transition-all">
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{isp.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{isp.domain || 'Not Configured'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px]">
                      {isp.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">{isp.customersCount} customers</td>
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{isp.revenue.toLocaleString()} PKR</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isp.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {isp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActivation(isp.id, isp.status === 'Active')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          isp.status === 'Active'
                            ? 'border-rose-500/20 text-rose-600 hover:bg-rose-500/10'
                            : 'border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10'
                        }`}
                      >
                        {isp.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(isp.id)}
                        className="p-1 rounded bg-secondary/50 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create ISP */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="fixed inset-0 z-50 bg-black"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-[480px] h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  <h3 className="font-extrabold text-base">Register New ISP Tenant</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-1 hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateISP} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">ISP Name *</label>
                  <input
                    type="text"
                    required
                    value={newIspName}
                    onChange={(e) => setNewIspName(e.target.value)}
                    placeholder="e.g. Cybernet Broadband"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Custom Access Domain *</label>
                  <input
                    type="text"
                    required
                    value={newIspDomain}
                    onChange={(e) => setNewIspDomain(e.target.value)}
                    placeholder="e.g. billing.cybernet.pk"
                    className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary focus:bg-card"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Subscription Plan</label>
                    <select
                      value={newIspPlan}
                      onChange={(e) => setNewIspPlan(e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary focus:bg-card"
                    >
                      <option value="Starter">Starter</option>
                      <option value="Professional">Professional</option>
                      <option value="Business">Business</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Currency Code</label>
                    <input
                      type="text"
                      value={newIspCurrency}
                      onChange={(e) => setNewIspCurrency(e.target.value)}
                      placeholder="PKR"
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Customer Quota</label>
                    <input
                      type="number"
                      required
                      value={newIspCustomerLimit}
                      onChange={(e) => setNewIspCustomerLimit(parseInt(e.target.value))}
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Storage Limit (MB)</label>
                    <input
                      type="number"
                      required
                      value={newIspStorageLimit}
                      onChange={(e) => setNewIspStorageLimit(parseInt(e.target.value))}
                      className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex h-10 items-center justify-center rounded-xl border border-border px-5 text-xs font-semibold hover:bg-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm"
                  >
                    Save Tenant Settings
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
