'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Users,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Campaign {
  id: string;
  name: string;
  channel: string;
  targetGroup: string;
  scheduledTime: string;
  status: string;
}

interface MessageLog {
  id: string;
  recipient: string;
  channel: string;
  message: string;
  timestamp: string;
  status: string;
}

export default function CommunicationPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form states
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campChannel, setCampChannel] = useState('WhatsApp');
  const [campTarget, setCampTarget] = useState('All Active Customers');
  const [campTime, setCampTime] = useState('2026-08-01 09:00 AM');
  const [campBody, setCampBody] = useState('');

  const [showDirectModal, setShowDirectModal] = useState(false);
  const [directRecipient, setDirectRecipient] = useState('');
  const [directChannel, setDirectChannel] = useState('WhatsApp');
  const [directMessage, setDirectMessage] = useState('');

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [campRes, logsRes] = await Promise.all([
        api.get('/communication/campaigns'),
        api.get('/communication/logs')
      ]);
      setCampaigns(campRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load communication settings:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/communication/campaigns', {
        name: campName,
        channel: campChannel,
        targetGroup: campTarget,
        scheduledTime: campTime,
        messageBody: campBody
      });
      setShowAddCampaignModal(false);
      setCampName('');
      setCampBody('');
      loadData();
    } catch (err) {
      alert('Failed to schedule campaign');
    }
  };

  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/communication/send-direct', {
        recipient: directRecipient,
        channel: directChannel,
        message: directMessage
      });
      setShowDirectModal(false);
      setDirectRecipient('');
      setDirectMessage('');
      alert('Message dispatched successfully!');
      loadData();
    } catch (err) {
      alert('Failed to send direct message');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Opening communications desk...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <span>Customer Communications Hub</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dispatch bulk SMS/WhatsApp notification campaigns, configure scheduled invoice reminders, and view delivery reports.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDirectModal(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Send Direct Message</span>
          </button>
          <button
            onClick={() => setShowAddCampaignModal(true)}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/95 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Campaign</span>
          </button>
        </div>
      </div>

      {/* Grid: Campaigns & Message Logs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Campaigns */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Scheduled Marketing Campaigns</span>
            </h3>
          </div>
          <div className="divide-y divide-border">
            {campaigns.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between text-xs hover:bg-secondary/10 transition-colors">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">{c.name}</span>
                  <span className="text-muted-foreground block text-[10px]">
                    Target: {c.targetGroup} | Channel: {c.channel}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold block w-fit ml-auto ${
                    c.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                  }`}>
                    {c.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block">{c.scheduledTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Logs */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-[350px]">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center flex-shrink-0">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>Real-time delivery logs</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400">Auditable messages</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl border border-border bg-secondary/20 text-xs space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{log.recipient}</span>
                  <span className="text-muted-foreground font-semibold">{log.timestamp}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">{log.message}</p>
                <div className="flex justify-between items-center pt-1 text-[9px]">
                  <span className="font-bold text-indigo-500">{log.channel} Gateway</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                    <CheckCircle className="h-3 w-3" />
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Schedule Campaign */}
      <AnimatePresence>
        {showAddCampaignModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowAddCampaignModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base">Schedule Campaign Broadcast</h3>
              <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Campaign Title *</label>
                  <input type="text" required value={campName} onChange={(e) => setCampName(e.target.value)} placeholder="e.g. Eid Mubarak Greetings" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Channel</label>
                    <select value={campChannel} onChange={(e) => setCampChannel(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="SMS">SMS</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground">Target Audience</label>
                    <select value={campTarget} onChange={(e) => setCampTarget(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                      <option value="All Active Customers">All Active</option>
                      <option value="Defaulters (Unpaid)">Defaulters</option>
                      <option value="Specific Area">Specific Area</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Broadcast Message Template *</label>
                  <textarea rows={3} required value={campBody} onChange={(e) => setCampBody(e.target.value)} placeholder="Type message body..." className="w-full rounded-xl border border-border p-3 outline-none bg-secondary/30" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Queue Broadcast</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal: Send Direct */}
      <AnimatePresence>
        {showDirectModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setShowDirectModal(false)} className="fixed inset-0 z-50 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 m-auto z-50 w-full max-w-sm h-fit bg-card border border-border rounded-[24px] p-6 shadow-2xl space-y-4">
              <h3 className="font-extrabold text-base">Send Direct Message</h3>
              <form onSubmit={handleSendDirect} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Recipient Info *</label>
                  <input type="text" required value={directRecipient} onChange={(e) => setDirectRecipient(e.target.value)} placeholder="e.g. 0300-1234567" className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Gateway Channel</label>
                  <select value={directChannel} onChange={(e) => setDirectChannel(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-foreground">Message Message *</label>
                  <textarea rows={3} required value={directMessage} onChange={(e) => setDirectMessage(e.target.value)} placeholder="Type message..." className="w-full rounded-xl border border-border p-3 outline-none bg-secondary/30" />
                </div>
                <button type="submit" className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2">Send Message</button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
