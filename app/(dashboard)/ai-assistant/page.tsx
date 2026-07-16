'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import {
  Brain,
  Send,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  FileText,
  User,
  Sparkles,
  BarChart2,
  List,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  queryType?: string;
  data?: any[];
  chartData?: any[];
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI Business Assistant. Ask me to explain revenue, summarize support complaints, predict customer churn risk, forecast next month\'s collections, or filter customer accounts.',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestionPrompts = [
    'Show customers with outstanding balance',
    'Which area has the most complaints?',
    'Forecast next month collection revenue',
    'Identify high-risk customer churn profiles',
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/query', { query: textToSend });
      const assistMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.data.response,
        queryType: res.data.queryType,
        data: res.data.data,
        chartData: res.data.chartData,
      };
      setMessages((prev) => [...prev, assistMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Sorry, I encountered an error checking our database. Ensure you are connected to the network.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
            <span>AI Operations Assistant</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Query billing databases in natural language, perform risk modeling, and request summaries.
          </p>
        </div>
      </div>

      {/* Main chat window and analytics grid */}
      <div className="flex-1 min-h-0 grid md:grid-cols-12 gap-6">
        {/* Chat message thread */}
        <div className="md:col-span-7 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden h-full">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-secondary text-foreground'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}>
                  {m.sender === 'user' ? <User className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </div>

                <div className="space-y-3">
                  <div className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/40 text-foreground border border-border'
                  }`}>
                    {m.text}
                  </div>

                  {/* Render Chart if present inside message */}
                  {m.chartData && m.chartData.length > 0 && (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-inner space-y-2 w-full min-w-[280px] sm:min-w-[400px]">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                        <BarChart2 className="h-3 w-3" />
                        <span>AI Visual Presentation</span>
                      </span>
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={m.chartData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis dataKey={m.queryType === 'complaint_heatmap' ? 'area' : (m.queryType === 'revenue_forecast' ? 'month' : 'name')} tick={{ fontSize: 9 }} />
                            <YAxis tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ fontSize: 10 }} />
                            <Bar dataKey={m.queryType === 'complaint_heatmap' ? 'count' : (m.queryType === 'revenue_forecast' ? 'revenue' : 'amount')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Render Table list if present */}
                  {m.data && m.data.length > 0 && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-inner max-w-full">
                      <span className="p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block border-b border-border flex items-center gap-1">
                        <List className="h-3 w-3" />
                        <span>AI Database Extraction</span>
                      </span>
                      <div className="max-h-40 overflow-y-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="bg-secondary/50 text-muted-foreground font-bold border-b border-border">
                              <th className="p-2">Name</th>
                              <th className="p-2">Area/Details</th>
                              <th className="p-2 text-right">Metric</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {m.data.slice(0, 5).map((row, idx) => (
                              <tr key={idx} className="hover:bg-secondary/20">
                                <td className="p-2 font-semibold">{row.name || row.month || row.packageName || row.customerId}</td>
                                <td className="p-2 text-muted-foreground">{row.area || row.reasons?.join(', ') || 'General'}</td>
                                <td className="p-2 text-right font-bold">
                                  {row.outstanding !== undefined ? `${row.outstanding} PKR` : (row.revenue !== undefined ? `${row.revenue} PKR` : (row.count || row.subscribers || row.riskScore || ''))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Brain className="h-4 w-4" />
                </div>
                <div className="bg-secondary/40 border border-border p-4 rounded-2xl flex items-center gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="px-4 py-2 bg-secondary/10 border-t border-border flex flex-wrap gap-1.5 flex-shrink-0">
            {suggestionPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="text-[10px] md:text-[11px] font-medium border border-border hover:border-primary/50 hover:bg-primary/5 rounded-full px-3 py-1 transition-all"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="p-4 border-t border-border bg-card flex gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask AI anything about the database..."
              className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 text-xs md:text-sm outline-none focus:border-primary focus:bg-card transition-all"
            />
            <button
              type="submit"
              className="h-11 w-11 flex items-center justify-center bg-primary rounded-xl text-primary-foreground hover:bg-primary/95 transition-all shadow-sm flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Sidebar reference guides */}
        <div className="md:col-span-5 space-y-6 overflow-y-auto h-full pr-1">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-indigo-500">
              <Sparkles className="h-4 w-4" />
              <span>Prompt Reference Guide</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our AI Assistant is connected directly to the billing database. It uses natural language processing to convert your queries to safe SQL queries, respecting multi-tenant boundaries.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                <span className="font-bold block mb-1">Financial Analysis</span>
                <span className="text-muted-foreground">"Explain revenue collection stats" or "Forecast next month billing"</span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                <span className="font-bold block mb-1">Outage & Complaints</span>
                <span className="text-muted-foreground">"Summarize complaint counts per area" or "Which technician has completed most tickets?"</span>
              </div>
              <div className="p-3 bg-secondary/30 rounded-xl border border-border">
                <span className="font-bold block mb-1">Recovery & Debts</span>
                <span className="text-muted-foreground">"Show unpaid customers list" or "Suggest recovery priorities"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
