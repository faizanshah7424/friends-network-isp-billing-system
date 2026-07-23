'use client';

import React from 'react';
import Image from 'next/image';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 flex flex-col items-center">
        {/* Logo */}
        <div className="relative w-32 h-16 mb-2">
          <Image
            src="/friends-logo.png"
            alt="Friends Network Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Offline Icon */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <WifiOff className="h-10 w-10 animate-pulse" />
        </div>

        {/* Messages */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">
            You are Offline
          </h1>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-xs mx-auto">
            Internet connection is currently unavailable. Please check your network connection and try again.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRetry}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry Connection</span>
        </button>

        <p className="text-[10px] text-slate-400 font-mono pt-2">
          Friends Network ISP Billing System • Offline Mode
        </p>
      </div>
    </div>
  );
}
