'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileFAB from '@/components/MobileFAB';
import PWAUpdateBanner from '@/components/PWAUpdateBanner';
import OfflineIndicator from '@/components/OfflineIndicator';
import PullToRefresh from '@/components/PullToRefresh';
import RechargeDialog from '@/components/RechargeDialog';
import CommandPalette from '@/components/CommandPalette';
import { X, ShieldAlert, ArrowLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useBillingSystem } from '@/lib/context';
import Link from 'next/link';
import LogoLoader from '@/components/ui/LogoLoader';

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { currentUser, isAuthenticated, isLoaded } = useBillingSystem();

  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoaded, isAuthenticated, router]);

  const isRestricted = currentUser.role === 'Sub Admin' && [
    '/billing',
    '/payments/bulk',
    '/invoices',
    '/packages',
    '/reports',
    '/balance-sheet',
    '/settings'
  ].some(p => pathname.startsWith(p));

  if (!isLoaded || !isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-card">
        <LogoLoader
          overlay
          text="Friends Network"
          subtext="Securing session..."
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      <PWAUpdateBanner />
      <OfflineIndicator />

      {/* Desktop Sidebar (hidden on mobile, permanent on desktop) */}
      <div className="hidden md:flex h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Slide-Over Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Dark Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileSidebar}
              className="fixed inset-0 z-50 bg-black md:hidden"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              {/* Close Button overlay */}
              <button
                onClick={closeMobileSidebar}
                className="absolute top-4 right-4 z-50 rounded-lg p-1 bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar onClose={closeMobileSidebar} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={toggleMobileSidebar} />
        
        {/* Scrollable page canvas with pull-to-refresh & mobile nav padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 pb-24 md:pb-8 bg-background">
          <PullToRefresh>
            <div className="mx-auto max-w-7xl space-y-6">
                {isRestricted ? (
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
                    <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-pulse">
                      <ShieldAlert className="h-8 w-8" />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h2 className="text-xl font-bold text-slate-800">Module Access Restricted</h2>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        You are logged in as <span className="font-semibold text-slate-700">{currentUser.name} (Sub Administrator)</span>. 
                        Your role does not have authorization to access the <span className="font-semibold text-rose-650 font-mono text-xs bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">{pathname}</span> module.
                      </p>
                    </div>
                    <Link
                      href="/"
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 text-xs font-semibold hover:bg-secondary transition-all"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Return to Dashboard</span>
                    </Link>
                  </div>
                ) : (
                  children
                )}
            </div>
          </PullToRefresh>
        </main>
      </div>

      {/* Mobile Controls */}
      <MobileBottomNav onMenuToggle={toggleMobileSidebar} />
      <MobileFAB />

      <RechargeDialog />
      <CommandPalette />
    </div>
  );
}
