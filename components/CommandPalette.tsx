'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  Receipt,
  CreditCard,
  Zap,
  AlertCircle,
  BarChart3,
  Settings,
  Wifi,
  X,
  Command,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBillingSystem } from '@/lib/context';

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { openRecharge, customers, currentUser } = useBillingSystem();
  const isSubAdmin = currentUser.role === 'Sub Admin';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + P -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      // Ctrl + N -> Add Customer
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        router.push('/customers/add');
      }
      // Ctrl + B -> Billing
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !isSubAdmin) {
        e.preventDefault();
        router.push('/billing');
      }
      // Ctrl + P -> Payments (without shift)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        router.push('/payments');
      }
      // Esc -> Close Command Palette
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, isSubAdmin]);

  const commands = [
    {
      id: 'add-customer',
      title: 'Add New Customer',
      subtitle: 'Create a new ISP subscriber record',
      icon: UserPlus,
      shortcut: 'Ctrl + N',
      action: () => router.push('/customers/add'),
    },
    {
      id: 'collect-payment',
      title: 'Collect Payment',
      subtitle: 'Record customer bill collection',
      icon: CreditCard,
      shortcut: 'Ctrl + P',
      action: () => router.push('/payments'),
    },
    {
      id: 'quick-recharge',
      title: 'Quick Recharge Account',
      subtitle: 'Instantly top up or adjust billing',
      icon: Zap,
      shortcut: 'Instant',
      action: () => {
        if (customers.length > 0) openRecharge(customers[0].id);
      },
    },
    {
      id: 'generate-invoice',
      title: 'Generate Monthly Invoice',
      subtitle: 'Issue bill & post to ledger',
      icon: Receipt,
      shortcut: 'Ctrl + B',
      disabled: isSubAdmin,
      action: () => router.push('/billing'),
    },
    {
      id: 'file-complaint',
      title: 'File Support Complaint',
      subtitle: 'Open a new technical field ticket',
      icon: AlertCircle,
      action: () => router.push('/complaints'),
    },
    {
      id: 'packages',
      title: 'Package Rates & Bandwidth',
      subtitle: 'Manage internet tariffs & speeds',
      icon: Wifi,
      action: () => router.push('/packages'),
    },
    {
      id: 'reports',
      title: 'Financial & Operational Reports',
      subtitle: 'View revenue & recovery analytics',
      icon: BarChart3,
      action: () => router.push('/reports'),
    },
    {
      id: 'settings',
      title: 'System Settings',
      subtitle: 'Company profile & preferences',
      icon: Settings,
      action: () => router.push('/settings'),
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (cmd.disabled) return false;
    if (!query) return true;
    const term = query.toLowerCase();
    return cmd.title.toLowerCase().includes(term) || cmd.subtitle.toLowerCase().includes(term);
  });

  const handleSelect = (cmd: typeof commands[0]) => {
    setIsOpen(false);
    setQuery('');
    cmd.action();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Command Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Input Bar */}
            <div className="flex items-center px-4 border-b border-border bg-secondary/30">
              <Search className="h-4 w-4 text-muted-foreground mr-3" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or search actions (Ctrl+Shift+P)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-13 w-full bg-transparent text-sm font-medium outline-none text-foreground"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              <span className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Quick Command Shortcuts
              </span>
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => handleSelect(cmd)}
                      className="flex w-full items-center justify-between p-3 rounded-xl hover:bg-secondary transition-colors text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{cmd.title}</h4>
                          <p className="text-[10px] text-muted-foreground">{cmd.subtitle}</p>
                        </div>
                      </div>
                      {cmd.shortcut && (
                        <span className="text-[10px] font-mono font-bold bg-secondary px-2 py-0.5 rounded border border-border text-muted-foreground">
                          {cmd.shortcut}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No matching commands found.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-secondary/40 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <div className="flex items-center gap-3">
                <span><kbd className="px-1 py-0.5 rounded bg-card border border-border">Ctrl+Shift+P</kbd> Command Palette</span>
                <span><kbd className="px-1 py-0.5 rounded bg-card border border-border">Esc</kbd> Close</span>
              </div>
              <div className="flex items-center gap-1">
                <Command className="h-3 w-3" />
                <span>Friends Network OS</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
