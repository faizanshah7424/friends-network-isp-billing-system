'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Server,
  TrendingUp,
  WifiOff,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface OltPort {
  port: string;
  status: string;
  onus: number;
  rxPower: string;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface RouterStatus {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: string;
}

interface OfflineCustomer {
  id: string;
  customerId?: string;
  name: string;
  area: string;
  phone: string;
  packageName: string;
}

interface NocData {
  onlineCount: number;
  offlineCount: number;
  oltPorts: OltPort[];
  alerts: Alert[];
  trafficGraph: any[];
  routers: RouterStatus[];
  offlineCustomers: OfflineCustomer[];
}

export default function NocDashboardPage() {
  const [data, setData] = useState<NocData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNocData = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/noc/metrics');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load NOC metrics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadNocData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Connecting to Network Operations Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span>NOC Operations Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time optical power monitoring, traffic distributions, active GPON port states, and OLT diagnostics.
          </p>
        </div>
        <button
          onClick={loadNocData}
          disabled={isRefreshing}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh NOC Feed</span>
        </button>
      </div>

      {/* Overview stats */}
      {data && (
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Subscribers Online</span>
            <div className="text-3xl font-black text-emerald-500">{data.onlineCount} online</div>
            <p className="text-[10px] text-muted-foreground">94.8% of active subscriber accounts connected.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Subscribers Offline</span>
            <div className="text-3xl font-black text-rose-500">{data.offlineCount} offline</div>
            <p className="text-[10px] text-muted-foreground">Includes normal scheduled deactivations.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Aggregate Traffic Load</span>
            <div className="text-3xl font-black text-indigo-500">9.2 Gbps peak</div>
            <p className="text-[10px] text-muted-foreground">Karachi Clifton core exchange router bandwidth.</p>
          </div>
        </div>
      )}

      {/* Traffic Chart and Alerts */}
      {data && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Traffic */}
          <div className="md:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base">Clifton Core Exchange Traffic load</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trafficGraph}>
                  <defs>
                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} unit=" Gbps" />
                  <Tooltip />
                  <Area type="monotone" dataKey="rxGbps" stroke="#6366f1" fillOpacity={1} fill="url(#colorRx)" name="Download Traffic" />
                  <Area type="monotone" dataKey="txGbps" stroke="#10b981" fillOpacity={0.05} fill="#10b981" name="Upload Traffic" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div className="md:col-span-4 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              <span>NOC Alarms &amp; Outages</span>
            </h3>
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {data.alerts.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl border border-border bg-rose-500/[0.02] space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{a.type}</span>
                    <span className="text-[9px] text-muted-foreground">{a.timestamp}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {a.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OLT Ports and Router CPU stats */}
      {data && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* OLT Status */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base">GPON OLT Port Status Feed</h3>
            <div className="space-y-3">
              {data.oltPorts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.port}</span>
                    <span className="text-[10px] text-muted-foreground block">ONU Count: {p.onus} connected</span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'Online' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-semibold">Attn: {p.rxPower}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Router CPU Memory status */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5">
              <Server className="h-5 w-5 text-primary" />
              <span>MikroTik Router Performance Engine</span>
            </h3>
            <div className="space-y-4">
              {data.routers.map((r) => (
                <div key={r.id} className="space-y-2.5 p-4 rounded-xl border border-border bg-secondary/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{r.name} ({r.ipAddress})</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{r.uptime}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                        <span>CPU Load</span>
                        <span>{r.cpu}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.cpu}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                        <span>Memory Load</span>
                        <span>{r.memory}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.memory}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Offline Customers Alert list */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <WifiOff className="h-5 w-5 text-rose-500" />
            <span>Active Offline Subscribers Warning List</span>
          </h3>
          <span className="text-xs bg-rose-500/10 text-rose-600 font-bold px-2.5 py-1 rounded-lg">
            Immediate attention needed
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-500/5 text-xs text-muted-foreground font-bold uppercase border-b border-border">
                <th className="px-6 py-3">Customer ID</th>
                <th className="px-6 py-3">Customer Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Distribution Area</th>
                <th className="px-6 py-3">Package Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs md:text-sm">
              {data?.offlineCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-500/[0.01]">
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold">{c.customerId || c.id}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-800 dark:text-slate-200">{c.name}</td>
                  <td className="px-6 py-3.5">{c.phone}</td>
                  <td className="px-6 py-3.5">{c.area}</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-secondary text-[11px] font-semibold">{c.packageName}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
