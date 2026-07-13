'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import RechargeDialog from '@/components/RechargeDialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
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
        
        {/* Scrollable page canvas with page transitions */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, ease: 'easeInOut' } }}
              exit={{ opacity: 0, scale: 0.99, transition: { duration: 0.15, ease: 'easeInOut' } }}
              className="mx-auto max-w-7xl space-y-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <RechargeDialog />
    </div>
  );
}
