'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Network, ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';
import { useBillingSystem } from '@/lib/context';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useBillingSystem();
  const [email, setEmail] = useState('shahid@friendsnetwork.net');
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      if (email.toLowerCase().includes('noor')) {
        setCurrentUser({
          name: 'Noor Jamal',
          role: 'Sub Admin',
          email: 'noor@friendsnetwork.net',
        });
      } else {
        setCurrentUser({
          name: 'Muhammad Shahid',
          role: 'Super Admin',
          email: 'shahid@friendsnetwork.net',
        });
      }
      router.push('/');
    }, 1200);
  };

  if (isLoading) {
    return (
      <LogoLoader
        fullscreen
        text="Friends Network"
        subtext="Internet Service Provider"
        loadingText="Loading Dashboard..."
      />
    );
  }


  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-800 font-sans p-4 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/5 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[420px] bg-white border border-slate-200/80 rounded-3xl p-8 shadow-2xl space-y-6 relative z-10"
      >
        {/* Branding Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 p-0.5 shadow-md shadow-blue-500/10">
            <div className="h-full w-full bg-white rounded-[14px] flex items-center justify-center">
              <img src="/friends-logo.png" alt="Friends Network Logo" className="h-9 w-9 object-contain" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Friends Network</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Internet Service Provider</p>
          </div>
        </div>

        {/* Quick Credentials / Role Selector */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-left space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Login Profiles (Demo)</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('shahid@friendsnetwork.net');
                setPassword('••••••••');
              }}
              className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                email === 'shahid@friendsnetwork.net'
                  ? 'border-blue-500 bg-blue-50/50 text-blue-600'
                  : 'border-slate-200 hover:bg-slate-100/50 text-slate-650 bg-white'
              }`}
            >
              <div className="font-extrabold truncate">Muhammad Shahid</div>
              <div className="text-[9px] font-medium text-slate-400 mt-0.5">Super Admin</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('noor@friendsnetwork.net');
                setPassword('••••••••');
              }}
              className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                email === 'noor@friendsnetwork.net'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600'
                  : 'border-slate-200 hover:bg-slate-100/50 text-slate-655 bg-white'
              }`}
            >
              <div className="font-extrabold truncate">Noor Jamal</div>
              <div className="text-[9px] font-medium text-slate-400 mt-0.5">Sub Admin</div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Administrator Email</label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-450" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shahid@friendsnetwork.net"
                className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-450" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-xs outline-none transition-all focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <label className="flex items-center gap-1.5 font-bold text-slate-500 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-primary border-slate-200" />
              <span>Remember session</span>
            </label>
            <a href="#" className="font-bold text-primary hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex h-10.5 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:opacity-95 disabled:opacity-50 transition-all pt-0.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secured with SSL redundancy encryption</span>
        </div>
      </motion.div>
    </div>
  );
}
