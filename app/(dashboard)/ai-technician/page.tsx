'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import {
  Wrench,
  Send,
  RefreshCw,
  Cpu,
  AlertTriangle,
  Bot,
} from 'lucide-react';

export default function AITechnicianAssistantPage() {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [spares, setSpares] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setReply('');
    setSpares([]);

    try {
      const res = await api.post('/ai-technician/assist', { message: query });
      setReply(res.data.reply);
      setSpares(res.data.suggestedSpares);
    } catch (err) {
      console.error(err);
      setReply('Failed to retrieve field engineer troubleshooting SOPs. Verify network connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Wrench className="h-8 w-8 text-primary animate-bounce" />
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Field Engineer AI Assistant</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time troubleshooting guidelines, attenuation fixes, core router port setup checklists, and required spare parts guides.
          </p>
        </div>
      </div>

      {/* Main body */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Ask panel */}
        <div className="md:col-span-5 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-base">Inquire Field Diagnostics</h3>
          <form onSubmit={handleAsk} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Describe Field Outage / Attenuation issue *</label>
              <textarea
                rows={4}
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Blinking PON light on Huawei ONU at customer site, or attenuation is -28dBm."
                className="w-full rounded-xl border border-border p-3 outline-none bg-secondary/30"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full h-10 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              <span>Troubleshoot Issue</span>
            </button>
          </form>
        </div>

        {/* Reply panel */}
        <div className="md:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5 min-h-[300px] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-base flex items-center gap-1.5 text-indigo-500">
              <Bot className="h-5 w-5 animate-pulse" />
              <span>AI Diagnostic Output</span>
            </h3>
            
            {reply ? (
              <div className="p-4 rounded-xl border border-border bg-indigo-500/[0.02] text-xs leading-relaxed space-y-3 whitespace-pre-line text-slate-800 dark:text-slate-200">
                {reply}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs font-semibold">
                Submit an inquiry to fetch automated fiber splicing and optical configuration checklist guidelines.
              </div>
            )}
          </div>

          {/* Spares recommendations */}
          {spares.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Suggested Spare Parts Needed:</h4>
              <div className="flex flex-wrap gap-2">
                {spares.map((spare, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg border border-border bg-secondary/35 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {spare}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
