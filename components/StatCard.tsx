'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number; // e.g., 5.4 or -2.1
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  gradient?: string; // Tailwind gradient classes
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'positive',
  subtext,
  gradient = 'from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 ${gradient}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-900 dark:text-white">{title}</span>
        <div className="rounded-xl bg-secondary p-2.5 text-primary">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value}</h3>
        
        {((change !== undefined) || subtext) && (
          <div className="mt-2 flex items-center gap-2">
            {change !== undefined && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  changeType === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : changeType === 'negative'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                    : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
                }`}
              >
                {changeType === 'positive' ? '+' : ''}
                {change}%
              </span>
            )}
            {subtext && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{subtext}</span>
            )}
          </div>
        )}
      </div>

      {/* Subtle background glow decorative element */}
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all duration-300 group-hover:bg-primary/10" />
    </motion.div>
  );
}
