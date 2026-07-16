'use client';

import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import {
  MessageSquare,
  Send,
  User,
  Bot,
  RefreshCw,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  isEscalation?: boolean;
}

export default function AICustomerSupportPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your Friends Network AI Support Assistant. I can assist you with checking your due bills, reviewing payment history, upgrades, reporting slow speeds/outages, or escalating your queries directly to a human operator. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [escalated, setEscalated] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userMsgText = inputText;
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to state
    setMessages((prev) => [...prev, { sender: 'user', text: userMsgText, timestamp: userTime }]);
    setInputText('');
    setIsSending(true);

    try {
      // Mock passing a valid session token for sandbox compatibility
      const res = await api.post(`/ai-customer/chat?token=FN-MOCK-TOKEN-JWT`, {
        message: userMsgText
      });
      
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.data.reply,
          timestamp: botTime,
          isEscalation: res.data.action === 'Escalate to Operator'
        }
      ]);
      
      if (res.data.action === 'Escalate to Operator') {
        setEscalated(true);
      }
    } catch (err) {
      console.error(err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I am facing connectivity issues. Please try again or dial our official customer helpline.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Bot className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">AI Support chatbot</h1>
            <span className="text-[10px] text-emerald-500 font-bold block flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Online &bull; Scoped Sandbox
            </span>
          </div>
        </div>
        {escalated && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-bold animate-bounce">
            <UserCheck className="h-4 w-4" />
            Human Agent Summoned
          </span>
        )}
      </div>

      {/* Chat logs */}
      <div className="bg-card border border-border rounded-[24px] shadow-sm flex flex-col h-[480px] overflow-hidden">
        {/* Messages container */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {m.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className="space-y-1">
                <div className={`p-4 rounded-[20px] text-xs font-medium leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-primary text-primary-foreground rounded-tr-none' 
                    : m.isEscalation 
                      ? 'bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                      : 'bg-secondary/40 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
                <span className={`text-[9px] text-muted-foreground font-semibold block ${
                  m.sender === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="border-t border-border p-4 bg-secondary/10 flex-shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about bills, active complaints, package upgrades..."
              className="flex-1 h-12 px-4 rounded-xl border border-border bg-card outline-none text-xs md:text-sm shadow-inner"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="h-12 w-12 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-xl flex items-center justify-center transition-all shadow-md disabled:opacity-50"
            >
              {isSending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
