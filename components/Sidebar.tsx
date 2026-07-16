'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  Layers,
  FileText,
  Wifi,
  AlertCircle,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Landmark,
} from 'lucide-react';
import { useBillingSystem } from '@/lib/context';

interface SidebarProps {
  onClose?: () => void; // Used for mobile overlay close
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { notifications, currentUser } = useBillingSystem();

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Customers', href: '/customers', icon: Users },
    { label: 'Billing', href: '/billing', icon: Receipt },
    { label: 'Payments', href: '/payments', icon: CreditCard },
    { label: 'Bulk Actions', href: '/payments/bulk', icon: Layers },
    { label: 'Invoices', href: '/invoices', icon: FileText },
    { label: 'Packages', href: '/packages', icon: Wifi },
    { label: 'Complaints', href: '/complaints', icon: AlertCircle },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Balance Sheet', href: '/balance-sheet', icon: Landmark },
    { label: 'Notifications', href: '/notifications', icon: Bell, badge: unreadNotifs },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (currentUser.role === 'Sub Admin') {
      return ['Dashboard', 'Customers', 'Payments', 'Complaints', 'Notifications'].includes(item.label);
    }
    if (currentUser.role === 'Super Admin') {
      return ['Dashboard', 'Customers', 'Billing', 'Payments', 'Bulk Actions', 'Invoices', 'Packages', 'Complaints', 'Reports', 'Balance Sheet', 'Settings'].includes(item.label);
    }
    return true;
  });

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card text-card-foreground">
      {/* Brand Logo */}
      <div className="flex h-16 items-center px-6 gap-3 border-b border-border">
        <img src="/friends-logo.png" alt="Friends Network Logo" className="h-9 w-9 object-contain rounded-xl" />
        <div className="flex flex-col text-left">
          <span className="font-bold text-base tracking-tight leading-none text-slate-800">Friends Network</span>
          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 tracking-wide uppercase">Internet Service Provider</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {filteredNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${
                  active ? '' : 'group-hover:scale-110'
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active ? 'bg-white text-primary' : 'bg-primary text-primary-foreground'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin Profile Details */}
      <div className="p-4 border-t border-border bg-slate-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`relative h-10 w-10 overflow-hidden rounded-xl flex items-center justify-center border ${
              currentUser.role === 'Sub Admin'
                ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20'
                : 'bg-blue-50 text-blue-600 border-primary/20'
            }`}>
              <span className="font-bold text-sm">
                {currentUser.name === 'Noor Jamal' ? 'NJ' : 'MS'}
              </span>
              {/* Green indicator online */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold leading-none">{currentUser.name}</span>
              <span className="text-[10px] text-muted-foreground mt-1">
                {currentUser.role === 'Sub Admin' ? 'Sub Administrator' : 'Super Administrator'}
              </span>
            </div>
          </div>

          <Link href="/login" className="rounded-lg p-2 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
