'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Receipt,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useBillingSystem } from '@/lib/context';
import { useTheme } from '@/lib/ThemeContext';
import Link from 'next/link';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { customers, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useBillingSystem();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<typeof customers>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
    setSearchResults(filtered.slice(0, 5));
  }, [searchQuery, customers]);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md">
      {/* Left Area: Mobile Menu Trigger & Search */}
      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Global Customer Search */}
        <div ref={searchRef} className="relative w-full max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customer (Name, ID, Mobile)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="h-10 w-full rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-11 z-50 w-full rounded-xl border border-border bg-card p-2 shadow-lg">
              <span className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Matching Customers
              </span>
              <div className="mt-1 space-y-0.5">
                {searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSearchResultClick(c.id)}
                    className="flex w-full items-center justify-between rounded-lg p-2 text-left hover:bg-secondary transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.id} • {c.area}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.connectionStatus === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}>
                      {c.connectionStatus}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showSearchDropdown && searchQuery.trim() !== '' && searchResults.length === 0 && (
            <div className="absolute top-11 z-50 w-full rounded-xl border border-border bg-card p-4 text-center shadow-lg">
              <p className="text-sm text-muted-foreground">No customers found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Add Customer */}
        <Link
          href="/customers/add"
          className="hidden md:flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 hover:shadow-primary/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Customer</span>
        </Link>

        {/* Create Bill */}
        <Link
          href="/billing"
          className="hidden md:flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-secondary transition-all"
        >
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <span>Create Bill</span>
        </Link>

        {/* Border separator */}
        <div className="h-5 w-px bg-border hidden md:block" />

        {/* Theme Indicator (Sun for Light Theme) */}
        <div
          className="rounded-xl p-2 text-blue-500 bg-blue-50 transition-colors"
          title="Premium Light Theme Active"
        >
          <Sun className="h-5 w-5" />
        </div>

        {/* Notifications Center */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`relative rounded-xl p-2.5 text-left text-xs transition-colors cursor-pointer border ${
                        notif.isRead
                          ? 'border-transparent hover:bg-secondary/40'
                          : 'bg-primary/5 border-primary/10 hover:bg-primary/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-foreground pr-2">{notif.title}</span>
                        {!notif.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-muted-foreground mt-1 leading-normal">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1.5 block">{notif.date}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No new notifications.
                  </div>
                )}
              </div>
              <div className="mt-3 border-t border-border pt-2 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifDropdown(false)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-1 cursor-pointer" onClick={() => router.push('/settings')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 p-px shadow-sm">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-card text-xs font-bold text-blue-600">
              MS
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
