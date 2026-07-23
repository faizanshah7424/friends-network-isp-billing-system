'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  X,
  UserPlus,
  Receipt,
  CreditCard,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBillingSystem } from '@/lib/context';

export default function MobileFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { openRecharge, customers, currentUser } = useBillingSystem();
  const isSubAdmin = currentUser.role === 'Sub Admin';

  const handleOpenRecharge = () => {
    setIsOpen(false);
    if (customers.length > 0) {
      openRecharge(customers[0].id);
    }
  };

  const fabActions = [
    {
      label: 'Add Customer',
      href: '/customers/add',
      icon: UserPlus,
      color: 'bg-indigo-600 text-white',
    },
    {
      label: 'Create Bill',
      href: '/billing',
      icon: Receipt,
      color: 'bg-blue-600 text-white',
      disabled: isSubAdmin,
    },
    {
      label: 'Collect Payment',
      href: '/payments',
      icon: CreditCard,
      color: 'bg-emerald-600 text-white',
    },
    {
      label: 'Quick Recharge',
      onClick: handleOpenRecharge,
      icon: Zap,
      color: 'bg-amber-600 text-white',
    },
    {
      label: 'File Complaint',
      href: '/complaints',
      icon: AlertCircle,
      color: 'bg-rose-600 text-white',
    },
  ];

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-30"
            />

            {/* Actions List */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute bottom-16 right-0 z-40 space-y-3 mb-2 flex flex-col items-end min-w-[200px]"
            >
              {fabActions.map((action, idx) => {
                if (action.disabled) return null;
                const Icon = action.icon;
                return action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 group"
                  >
                    <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/80">
                      {action.label}
                    </span>
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1.5 rounded-xl shadow-lg border border-slate-700/80">
                      {action.label}
                    </span>
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${action.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transition-all active:scale-90 hover:bg-primary/95 cursor-pointer relative z-40"
        aria-label="Quick Actions Floating Menu"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-7 w-7" />
        </motion.div>
      </button>
    </div>
  );
}
