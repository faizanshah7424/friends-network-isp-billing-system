'use client';

import React from 'react';
import { Customer } from '@/types';
import Link from 'next/link';
import { Phone, MapPin, Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import { useBillingSystem } from '@/lib/context';

interface CustomerQuickPreviewProps {
  customer: Customer;
  children: React.ReactNode;
}

export default function CustomerQuickPreview({ customer, children }: CustomerQuickPreviewProps) {
  const { openRecharge } = useBillingSystem();
  const [showPreview, setShowPreview] = React.useState(false);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setShowPreview(true), 400);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowPreview(false);
  };

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {showPreview && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 bg-card border border-border rounded-2xl p-4 shadow-2xl space-y-3 text-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                {customer.customerId || customer.id}
              </span>
              <h4 className="font-bold text-foreground text-sm mt-1">{customer.name}</h4>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              customer.connectionStatus === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
            }`}>
              {customer.connectionStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-secondary/30 rounded-xl p-2 font-mono text-[10px]">
            <div>
              <span className="text-muted-foreground block uppercase font-sans text-[8px] font-bold">Package</span>
              <span className="font-bold truncate block">{customer.packageName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block uppercase font-sans text-[8px] font-bold">Balance</span>
              <span className={`font-bold ${customer.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                PKR {customer.outstandingBalance}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-primary" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-rose-500" />
              <span className="truncate">{customer.area}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t border-border">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRecharge(customer.id);
              }}
              className="flex-1 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold flex items-center justify-center gap-1 text-[11px] transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Recharge</span>
            </button>
            <Link
              href={`/customers/${customer.id}`}
              className="flex-1 h-9 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-1 text-[11px] transition-colors"
            >
              <span>Open Profile</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
