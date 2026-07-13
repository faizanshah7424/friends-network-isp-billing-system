'use client';

import React, { useState } from 'react';
import { useBillingSystem } from '@/lib/context';
import {
  Bell,
  CheckCheck,
  Check,
  CreditCard,
  UserPlus,
  AlertCircle,
  MessageSquare,
  Clock,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useBillingSystem();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifs = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_received':
        return (
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
            <CreditCard className="h-5 w-5" />
          </div>
        );
      case 'new_customer':
        return (
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
        );
      case 'complaint_created':
        return (
          <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-500">
            <AlertCircle className="h-5 w-5" />
          </div>
        );
      case 'payment_pending':
        return (
          <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="rounded-xl bg-slate-500/10 p-2.5 text-slate-500">
            <Bell className="h-5 w-5" />
          </div>
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">System Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Reconcile daily payments, telemetry alerts, and registration events in a chronological feed.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
          >
            <CheckCheck className="h-4.5 w-4.5 text-primary" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex border-b border-border bg-card p-1 rounded-xl shadow-sm max-w-xs">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-3.5">
        <AnimatePresence initial={false}>
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-4 p-4 rounded-2xl border transition-all duration-200 bg-card ${
                  notif.isRead
                    ? 'border-border opacity-75 hover:opacity-100'
                    : 'border-primary/20 shadow-sm shadow-primary/5 bg-primary/5'
                }`}
              >
                {getIcon(notif.type)}

                <div className="flex-1 space-y-1 text-left text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-foreground text-sm">{notif.title}</span>
                    <span className="text-[10px] text-muted-foreground/75 font-medium">{notif.date}</span>
                  </div>
                  <p className="text-muted-foreground leading-normal text-xs">{notif.message}</p>
                </div>

                {!notif.isRead && (
                  <div className="flex items-center">
                    <button
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition-colors"
                      title="Mark as Read"
                    >
                      <Check className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="bg-card border border-border p-12 rounded-2xl text-center text-xs text-muted-foreground">
              No notifications to display.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
