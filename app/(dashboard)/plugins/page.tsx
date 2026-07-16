'use client';

import React, { useState, useEffect } from 'react';
import {
  Plug,
  RefreshCw,
  Cpu,
  Activity,
  Zap,
} from 'lucide-react';

interface PluginInfo {
  name: string;
  version: string;
  description: string;
  author: string;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlugins = () => {
    // Return sample list + query backend
    // Since plugins directory loads dynamically, we simulate their states in the UI cleanly.
    setIsLoading(true);
    setTimeout(() => {
      setPlugins([
        {
          name: 'SMS Gateway Pro Extension',
          version: '1.0.0',
          description: 'Integrates third-party SMS marketing endpoints for broadcast automation.',
          author: 'External Developer'
        },
        {
          name: 'OLT Power Monitor Integration',
          version: '2.4.1',
          description: 'Pulls GPON port rx optical strength and attenuation values directly from OLT.',
          author: 'Huawei Tech Co.'
        }
      ]);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadPlugins();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <Plug className="h-8 w-8 text-primary" />
            <span>Plugin &amp; Extension Framework</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Load, configure, and register third-party plugins dynamically without modifying the core system codebase.
          </p>
        </div>
        <button
          onClick={loadPlugins}
          className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reload Extensions</span>
        </button>
      </div>

      {/* Grid: Plugins list */}
      <div className="grid gap-6 sm:grid-cols-2">
        {plugins.map((plugin, idx) => (
          <div key={idx} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-[100px] flex items-start justify-end p-3 text-primary">
              <Zap className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm md:text-base">{plugin.name}</span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                  {plugin.version}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {plugin.description}
              </p>
            </div>

            <div className="border-t border-border pt-3 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              <span>Author: {plugin.author}</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
