'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  CreditCard,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { useBillingSystem } from '@/lib/context';

interface MobileBottomNavProps {
  onMenuToggle: () => void;
}

export default function MobileBottomNav({ onMenuToggle }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { currentUser } = useBillingSystem();
  const isSubAdmin = currentUser.role === 'Sub Admin';

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Customers',
      href: '/customers',
      icon: Users,
      active: pathname.startsWith('/customers'),
    },
    {
      name: 'Billing',
      href: '/billing',
      icon: Receipt,
      active: pathname.startsWith('/billing'),
      disabled: isSubAdmin,
    },
    {
      name: 'Payments',
      href: '/payments',
      icon: CreditCard,
      active: pathname.startsWith('/payments'),
    },
    {
      name: 'Complaints',
      href: '/complaints',
      icon: AlertCircle,
      active: pathname.startsWith('/complaints'),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border px-2 py-1.5 shadow-2xl transition-all">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          if (item.disabled) return null;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              aria-current={item.active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                item.active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <Icon className={`h-5 w-5 mb-0.5 ${item.active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Menu / Drawer Toggle */}
        <button
          onClick={onMenuToggle}
          aria-label="Open Navigation Menu"
          className="flex flex-col items-center justify-center min-h-[48px] w-full py-1 rounded-xl text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all active:scale-95 cursor-pointer"
        >
          <Menu className="h-5 w-5 mb-0.5 text-muted-foreground" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
