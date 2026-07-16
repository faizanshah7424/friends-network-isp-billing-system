'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  Brain,
  Cpu,
  RefreshCw,
  Sliders,
  Shield,
  Clock,
  User,
} from 'lucide-react';

interface AISettings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  rateLimit: number;
}

interface AuditLog {
  id: string;
  username: string;
  modelUsed: string;
  prompt: string;
  response: string;
  tokensUsed: number;
  executionTimeMs: number;
  timestamp: string;
}

export default function AIAdminPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [provider, setProvider] = useState('Google Gemini');
  const [model, setModel] = useState('gemini-3.5-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [rateLimit, setRateLimit] = useState(100);

  const loadData = async () => {
    try {
      const [setRes, audRes] = await Promise.all([
        api.get('/ai-admin/settings'),
        api.get('/ai-admin/audits')
      ]);
      setSettings(setRes.data);
      setAudits(audRes.data);

      setProvider(setRes.data.provider);
      setModel(setRes.data.model);
      setTemperature(setRes.data.temperature);
      setMaxTokens(setRes.data.maxTokens);
      setSystemPrompt(setRes.data.systemPrompt);
      setRateLimit(setRes.data.rateLimit);
    } catch (err) {
      console.error('Failed to load AI parameters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.post('/ai-admin/settings', {
        provider,
        model,
        temperature,
        maxTokens,
        systemPrompt,
        rateLimit
      });
      setSettings(res.data);
      alert('AI Configuration parameters saved successfully across all default tenant scopes!');
    } catch (err) {
      alert('Failed to save AI configuration settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground font-semibold">Opening AI Administration settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">AI Engine &amp; Model Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure dynamic LLM routing provider mappings, temperature presets, system context scopes, and query auditing.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Settings Form */}
        <div className="md:col-span-5 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-1.5">
            <Sliders className="h-5 w-5 text-primary" />
            <span>LLM Parameter Tuning</span>
          </h3>
          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">AI Provider Gateway</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none">
                <option value="Google Gemini">Google Gemini</option>
                <option value="OpenAI">OpenAI GPT</option>
                <option value="Anthropic Claude">Anthropic Claude</option>
                <option value="Local Llama3">Local Llama3 (Ollama)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Active Model Name</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Temperature (0 - 1.0)</label>
                <input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Max Tokens Limit</label>
                <input type="number" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Operator System Prompt Context Override</label>
              <textarea rows={4} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="w-full rounded-xl border border-border p-3 outline-none bg-secondary/30" />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Rate Limit (req/min)</label>
              <input type="number" value={rateLimit} onChange={(e) => setRateLimit(parseInt(e.target.value))} className="h-10 w-full rounded-xl border border-border bg-secondary/30 px-3 outline-none" />
            </div>
            <button type="submit" disabled={isSaving} className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-xl mt-2 transition-colors">
              {isSaving ? 'Saving Configurations...' : 'Commit Model Configurations'}
            </button>
          </form>
        </div>

        {/* Audits History */}
        <div className="md:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col h-[520px]">
          <h3 className="font-bold text-base flex items-center gap-1.5 text-indigo-500">
            <Shield className="h-5 w-5" />
            <span>AI Operations Audit Trails</span>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {audits.map((a) => (
              <div key={a.id} className="p-3.5 rounded-xl border border-border bg-secondary/10 text-xs space-y-1.5 relative overflow-hidden">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {a.username}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                    <Clock className="h-3 w-3" />
                    {a.timestamp}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    <span className="text-indigo-500 font-bold">Query:</span> {a.prompt}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic pl-3 border-l-2 border-primary/20">
                    {a.response}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-border/30 text-[9px] text-muted-foreground font-bold uppercase tracking-wide">
                  <span>Engine: {a.modelUsed}</span>
                  <span>Latency: {a.executionTimeMs}ms | Tokens: {a.tokensUsed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
