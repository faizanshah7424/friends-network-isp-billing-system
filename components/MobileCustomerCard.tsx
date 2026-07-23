'use client';

import React, { useState, useRef } from 'react';
import { Customer } from '@/types';
import Link from 'next/link';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Phone,
  MessageCircle,
  MapPin,
  Zap,
  Receipt,
  CreditCard,
  Eye,
  MoreVertical,
  Copy,
  Check,
  UserCheck,
  UserX,
  ExternalLink,
} from 'lucide-react';
import { useBillingSystem } from '@/lib/context';
import BottomSheet from '@/components/ui/BottomSheet';

interface MobileCustomerCardProps {
  customer: Customer;
}

export default function MobileCustomerCard({ customer }: MobileCustomerCardProps) {
  const { openRecharge, suspendCustomer, activateCustomer } = useBillingSystem();

  const [showLongPressSheet, setShowLongPressSheet] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe animation values
  const x = useMotionValue(0);
  const swipeBackground = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(37, 99, 235, 0.15)', 'rgba(255, 255, 255, 1)', 'rgba(16, 185, 129, 0.15)']
  );

  const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.replace(/^0/, '92')}`;
  const telUrl = `tel:${cleanPhone}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${customer.address}, ${customer.area}`
  )}`;

  // Long press handlers
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowLongPressSheet(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -80) {
      // Swipe Left -> Quick Recharge
      openRecharge(customer.id);
    } else if (info.offset.x > 80) {
      // Swipe Right -> View Customer Details
      if (typeof window !== 'undefined') {
        window.location.href = `/customers/${customer.id}`;
      }
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'phone') => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    }
  };

  return (
    <>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ x }}
        className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3 relative overflow-hidden transition-all active:shadow-md"
      >
        {/* Header Row: ID, Name, Badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                {customer.customerId || customer.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                customer.connectionStatus === 'Active'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}>
                {customer.connectionStatus}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground mt-1.5 line-clamp-1">{customer.name}</h4>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              customer.paymentStatus === 'Paid'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}>
              {customer.paymentStatus}
            </span>
            <button
              onClick={() => setShowLongPressSheet(true)}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contact & Location Info */}
        <div className="grid grid-cols-2 gap-2 text-xs border-y border-border/50 py-2.5">
          {/* Click to Call & WhatsApp */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-muted-foreground block">Contact</span>
            <div className="flex items-center gap-2">
              <a
                href={telUrl}
                className="font-bold text-slate-800 dark:text-slate-200 hover:text-primary flex items-center gap-1 min-h-[36px]"
              >
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-xs">{customer.phone}</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                title="Open WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Area & Address Maps link */}
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-muted-foreground block">Location</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-700 dark:text-slate-300 hover:text-primary flex items-center gap-1 min-h-[36px] truncate"
            >
              <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
              <span className="truncate text-xs">{customer.area}</span>
              <ExternalLink className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* Financial Details Row */}
        <div className="grid grid-cols-3 gap-2 bg-secondary/30 rounded-xl p-2.5 text-[11px]">
          <div>
            <span className="text-[9px] font-bold uppercase text-muted-foreground block">Package</span>
            <span className="font-bold text-foreground truncate block">{customer.packageName}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase text-muted-foreground block">Monthly</span>
            <span className="font-bold text-foreground">PKR {customer.monthlyCharges}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold uppercase text-muted-foreground block">Balance</span>
            <span className={`font-black ${customer.outstandingBalance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
              PKR {customer.outstandingBalance}
            </span>
          </div>
        </div>

        {/* Bottom Action Row (min 48px touch targets) */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <Link
            href={`/customers/${customer.id}`}
            className="h-11 min-h-[44px] rounded-xl border border-border bg-card hover:bg-secondary text-xs font-bold flex items-center justify-center gap-1 text-foreground transition-all active:scale-95"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span>View</span>
          </Link>

          <button
            onClick={() => openRecharge(customer.id)}
            className="h-11 min-h-[44px] rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="h-4 w-4" />
            <span>Recharge</span>
          </button>

          <Link
            href={`/billing?customerId=${customer.id}`}
            className="h-11 min-h-[44px] rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            <Receipt className="h-4 w-4" />
            <span>Bill</span>
          </Link>

          <Link
            href={`/payments?customerId=${customer.id}`}
            className="h-11 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay</span>
          </Link>
        </div>
      </motion.div>

      {/* Long Press Context Bottom Sheet */}
      <BottomSheet
        isOpen={showLongPressSheet}
        onClose={() => setShowLongPressSheet(false)}
        title={customer.name}
        subtitle={`ID: ${customer.customerId || customer.id} • ${customer.phone}`}
      >
        <div className="space-y-2 py-2">
          {/* Call Customer */}
          <a
            href={telUrl}
            className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center gap-3 px-4 transition-colors"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span>Call Customer ({customer.phone})</span>
          </a>

          {/* Open WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-3 px-4 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Open WhatsApp Chat</span>
          </a>

          {/* Copy Customer ID */}
          <button
            onClick={() => copyToClipboard(customer.customerId || customer.id, 'id')}
            className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center justify-between px-4 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span>Copy Customer ID ({customer.customerId || customer.id})</span>
            </div>
            {copiedId ? <Check className="h-4 w-4 text-emerald-600" /> : null}
          </button>

          {/* Copy Phone */}
          <button
            onClick={() => copyToClipboard(customer.phone, 'phone')}
            className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold flex items-center justify-between px-4 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Copy className="h-4 w-4 text-muted-foreground" />
              <span>Copy Phone Number</span>
            </div>
            {copiedPhone ? <Check className="h-4 w-4 text-emerald-600" /> : null}
          </button>

          {/* Toggle Suspend / Resume */}
          <button
            onClick={() => {
              if (customer.connectionStatus === 'Active') {
                suspendCustomer(customer.id);
              } else {
                activateCustomer(customer.id);
              }
              setShowLongPressSheet(false);
            }}
            className={`w-full h-12 rounded-xl text-xs font-bold flex items-center gap-3 px-4 transition-colors cursor-pointer ${
              customer.connectionStatus === 'Active'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {customer.connectionStatus === 'Active' ? (
              <>
                <UserX className="h-4 w-4" />
                <span>Suspend Connection</span>
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                <span>Resume Connection</span>
              </>
            )}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
