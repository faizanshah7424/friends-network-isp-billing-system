'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Key,
  Shield,
  Layers,
  Calendar,
  Cpu,
  RefreshCw,
  FileCode,
  CheckCircle,
  Copy,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LicenseStatus {
  tenantId: string;
  licenseKey: string | null;
  isActivated: boolean;
  hardwareFingerprint: string | null;
  plan: string;
  expiry: string | null;
  daysRemaining: number | null;
}

export default function LicensingPage() {
  const [licenseData, setLicenseData] = useState<LicenseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Key generator states
  const [tenantList, setTenantList] = useState<{ id: string; name: string }[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Starter');
  const [expiryDays, setExpiryDays] = useState(30);
  const [generatedKey, setGeneratedKey] = useState('');
  
  // Activation states
  const [activationKey, setActivationKey] = useState('');
  const [fingerprint, setFingerprint] = useState('FN-HW-MOCK-6B2A8C1D');
  
  // Offline verify states
  const [offlinePayload, setOfflinePayload] = useState('');
  const [offlineResult, setOfflineResult] = useState<any>(null);

  const loadStatus = async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, tenantsRes] = await Promise.all([
        api.get('/license/status'),
        api.get('/tenants/')
      ]);
      setLicenseData(statusRes.data);
      setTenantList(tenantsRes.data);
      if (tenantsRes.data.length > 0) {
        setSelectedTenant(tenantsRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load license status:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/license/generate', {
        tenantId: selectedTenant,
        plan: selectedPlan,
        expiryDays: expiryDays
      });
      setGeneratedKey(res.data.licenseKey);
      loadStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate license key');
    }
  };

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/license/activate', {
        licenseKey: activationKey,
        hardwareFingerprint: fingerprint
      });
      alert('License activated successfully!');
      loadStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Activation failed');
    }
  };

  const handleVerifyOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/license/verify-offline', {
        activationPayload: offlinePayload
      });
      setOfflineResult(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Offline verification failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Loading licensing certificates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">Commercial Licensing Console</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate ISP license keys, perform secure machine fingerprint activation, and verify digital activations offline.
          </p>
        </div>
        <button
          onClick={loadStatus}
          disabled={isRefreshing}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Details</span>
        </button>
      </div>

      {/* Current License Status */}
      {licenseData && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Active Tenant License Information</span>
          </h3>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Activation Status</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                licenseData.isActivated ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${licenseData.isActivated ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {licenseData.isActivated ? 'Activated & Locked' : 'Pending Activation'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Subscription Plan</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white">{licenseData.plan} Edition</span>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">License Key</span>
              <span className="font-mono text-xs font-semibold bg-secondary px-2 py-1 rounded border border-border">
                {licenseData.licenseKey || 'No License Installed'}
              </span>
            </div>

            {licenseData.hardwareFingerprint && (
              <div className="space-y-1 sm:col-span-3">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Hardware Node Fingerprint</span>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                  {licenseData.hardwareFingerprint}
                </span>
              </div>
            )}

            {licenseData.expiry && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider block">Expiry / Days Remaining</span>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(licenseData.expiry).toLocaleDateString()} ({licenseData.daysRemaining} days left)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Generate License Key */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <span>Generate Commercial License Key</span>
          </h3>

          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Tenant ISP *</label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
              >
                {tenantList.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">License Plan</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
                >
                  <option value="Starter">Starter</option>
                  <option value="Professional">Professional</option>
                  <option value="Business">Business</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Expiry Duration (Days)</label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all"
            >
              Generate Key
            </button>
          </form>

          {generatedKey && (
            <div className="mt-4 p-4 bg-secondary rounded-xl border border-border space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Generated License Key</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 break-all select-all">
                  {generatedKey}
                </span>
                <button
                  onClick={() => copyToClipboard(generatedKey)}
                  className="p-1.5 rounded hover:bg-slate-500/10 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* License Activation */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span>Machine Activation Portal</span>
          </h3>

          <form onSubmit={handleActivateKey} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Enter License Key *</label>
              <input
                type="text"
                required
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                placeholder="e.g. FRIE-ENT-2026..."
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Hardware Fingerprint ID *</label>
              <input
                type="text"
                required
                value={fingerprint}
                onChange={(e) => setFingerprint(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 text-xs font-semibold text-white shadow-lg hover:shadow-indigo-500/10 transition-all"
            >
              Activate Machine
            </button>
          </form>
        </div>

        {/* Offline Verification */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-bold text-base border-b border-border pb-3 flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            <span>Signed Offline Verification Engine</span>
          </h3>

          <form onSubmit={handleVerifyOffline} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Paste Activation Payload *</label>
              <textarea
                rows={3}
                required
                value={offlinePayload}
                onChange={(e) => setOfflinePayload(e.target.value)}
                placeholder="Paste the cryptographically signed base64 token here..."
                className="w-full rounded-xl border border-border p-3 text-xs outline-none bg-secondary/30 transition-all focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="flex h-10 items-center justify-center rounded-xl border border-border bg-card px-5 text-xs font-semibold hover:bg-secondary"
            >
              Verify Payload Signature
            </button>
          </form>

          {offlineResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              offlineResult.valid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="h-5 w-5" />
                <span>{offlineResult.valid ? 'Verification Success: Authentic License Signature' : 'Verification Failure'}</span>
              </div>
              <pre className="font-mono text-[11px] p-2 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">
                {JSON.stringify(offlineResult.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
