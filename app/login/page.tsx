'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';
import { useBillingSystem } from '@/lib/context';
import { authService } from '@/services/auth';

const FiberOpticBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = 45;
    const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1.2,
      });
    }

    const pulses: { from: number; to: number; progress: number; speed: number }[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw floating nodes (Indigo particles)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw connecting wires (lines between adjacent nodes)
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Occasionally spawn data pulses
            if (Math.random() < 0.0004 && pulses.length < 15) {
              pulses.push({
                from: i,
                to: j,
                progress: 0,
                speed: Math.random() * 0.01 + 0.005,
              });
            }
          }
        }
      }

      // Draw glowing light pulses
      pulses.forEach((pulse, idx) => {
        pulse.progress += pulse.speed;
        if (pulse.progress >= 1) {
          pulses.splice(idx, 1);
          return;
        }

        const p1 = nodes[pulse.from];
        const p2 = nodes[pulse.to];
        if (p1 && p2) {
          const x = p1.x + (p2.x - p1.x) * pulse.progress;
          const y = p1.y + (p2.y - p1.y) * pulse.progress;

          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#059669'; // Glowing Emerald
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#059669';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none block z-0 animate-fade-in" />;
};

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useBillingSystem();
  const [email, setEmail] = useState('muhammad_shahid@friendsnetwork.net');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage.handleLogin] Form submit triggered. Email:', email);
    setIsLoading(true);
    setError(null);

    try {
      // Allow clean username or full email address
      const username = email.includes('@') ? email.split('@')[0] : email;
      const cleanPassword = password || 'shahid123'; // Default fallback if they left unchanged
      
      console.log('[LoginPage.handleLogin] Resolved credentials - Username:', username);
      console.log('[LoginPage.handleLogin] Calling authService.login()...');
      const res = await authService.login(username, cleanPassword);
      console.log('[LoginPage.handleLogin] Login succeeded, access token:', res?.access_token);
      localStorage.setItem('fnb_access_token', res.access_token);
      
      console.log('[LoginPage.handleLogin] Fetching user info via getMe()...');
      const me = await authService.getMe();
      console.log('[LoginPage.handleLogin] User info fetched successfully:', me);
      const userSession = {
        name: me.fullName,
        role: me.role.name as 'Super Admin' | 'Sub Admin',
        email: me.username + '@friendsnetwork.net',
      };
      
      setIsLoading(false);
      setIsRedirecting(true);

      // Post-auth redirection delay for loader splash
      setTimeout(() => {
        setCurrentUser(userSession);
        router.push('/');
      }, 1500);
    } catch (err: unknown) {
      console.error('[LoginPage.handleLogin] Login sequence failed with error:', err);
      setIsLoading(false);
      
      let errorMessage = "Authentication failed. Please verify credentials.";
      const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
      
      if (!axiosError.response) {
        // No response means server is unreachable
        errorMessage = "Unable to connect to the server.";
      } else {
        const detail = axiosError.response.data?.detail;
        if (detail) {
          if (typeof detail === 'string') {
            if (detail.toLowerCase() === "incorrect username or password" || detail.toLowerCase() === "incorrect username or password.") {
              errorMessage = "Invalid username or password";
            } else if (detail.toLowerCase() === "inactive user account") {
              errorMessage = "User account is inactive. Please contact system administrator.";
            } else {
              errorMessage = detail;
            }
          } else {
            errorMessage = JSON.stringify(detail);
          }
        } else {
          const status = axiosError.response.status;
          if (status === 401) {
            errorMessage = "Unauthorized access.";
          } else if (status === 403) {
            errorMessage = "Access forbidden.";
          } else if (status === 404) {
            errorMessage = "Authentication service not found.";
          } else if (status && status >= 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }
      }
      setError(errorMessage);
    }
  };

  if (isRedirecting) {
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
    <div 
      className="min-h-screen w-screen flex flex-col sm:flex-row bg-slate-50 text-slate-900 font-sans relative overflow-y-auto sm:overflow-y-auto select-none"
    >
      {/* Premium animated canvas background (restoring floating nodes, glowing dots, and connection lines) */}
      <FiberOpticBackground />

      {/* Decorative gradient color overlay blur circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />

      {/* LEFT PANEL: Branding & Taglines (Restoring original layout, original transitions, and spacing) */}
      <div className="w-full sm:w-[60%] lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 md:p-16 border-b sm:border-b-0 sm:border-r border-slate-200/60 relative z-10 bg-gradient-to-br from-white/90 via-slate-50/60 to-transparent backdrop-blur-[3px]">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-md shadow-indigo-500/10">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <img src="/friends-logo.png" alt="Friends Network Logo" className="h-7 w-7 object-contain" />
            </div>
          </div>
          <span className="font-extrabold text-lg text-slate-800 tracking-tight">Friends Network</span>
        </div>

        {/* Core Tagline / Welcome message */}
        <div className="my-auto py-12 text-left space-y-6 max-w-lg">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-[48px] lg:leading-[56px] font-bold tracking-tight text-slate-900"
          >
            Centralized ISP billing &amp; customer operations.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm md:text-base text-slate-600 leading-relaxed max-w-md"
          >
            Manage subscribers, record credit ledger transactions, resolve complaints, and view distribution reports in one high-performance dashboard.
          </motion.p>

          {/* Three Feature Bullets */}
          <div className="space-y-3.5 pt-4">
            <div className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>Customer Management</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>Billing &amp; Payments</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-semibold text-sm">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
              <span>Reports &amp; Analytics</span>
            </div>
          </div>
        </div>

        {/* Security / Quality Assurance footer */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>Centralized Administration Desk</span>
        </div>
      </div>

      {/* RIGHT PANEL: Modern Centered Login Form Card */}
      <div className="w-full sm:w-[40%] lg:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 relative z-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key="login-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[460px] bg-white border border-slate-200/80 rounded-[32px] p-8 md:p-10 shadow-2xl space-y-6 text-left"
          >
            <div className="space-y-1.5">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Sign In</h1>
              <p className="text-xs text-blue-600 font-extrabold uppercase tracking-widest">Access the billing console</p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Credentials Profiles */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">Quick Login Profiles</span>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setEmail('muhammad_shahid@friendsnetwork.net');
                    setPassword('shahid123');
                    setError(null);
                  }}
                  className={`flex-1 p-3 rounded-xl border text-[11px] font-bold text-left transition-all ${
                    email === 'muhammad_shahid@friendsnetwork.net'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm font-extrabold'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold truncate">M. Shahid</span>
                    {email === 'muhammad_shahid@friendsnetwork.net' ? (
                      <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    )}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-500 mt-0.5">Super Admin</div>
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setEmail('noor_jamal@friendsnetwork.net');
                    setPassword('noor123');
                    setError(null);
                  }}
                  className={`flex-1 p-3 rounded-xl border text-[11px] font-bold text-left transition-all ${
                    email === 'noor_jamal@friendsnetwork.net'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-900 shadow-sm font-extrabold'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold truncate">Noor Jamal</span>
                    {email === 'noor_jamal@friendsnetwork.net' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                    )}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-500 mt-0.5">Sub Admin</div>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Administrator Email</label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="e.g. shahid@friendsnetwork.net"
                    className="h-[52px] w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-xs md:text-sm text-slate-900 placeholder-slate-500 outline-none transition-all hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter password"
                    className="h-[52px] w-full rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-xs md:text-sm text-slate-900 placeholder-slate-500 outline-none transition-all hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    defaultChecked 
                    className="rounded text-blue-600 border-slate-300 bg-white focus:ring-blue-500/50 focus:ring-offset-0 h-4 w-4 cursor-pointer" 
                  />
                  <span className="font-semibold text-slate-600">Remember session</span>
                </label>
                <a href="#" className="font-extrabold text-blue-600 hover:text-blue-500 transition-colors hover:underline">Forgot password?</a>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full flex h-[52px] items-center justify-center rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] disabled:bg-blue-300 disabled:cursor-not-allowed text-xs md:text-sm font-extrabold text-white shadow-md hover:shadow-lg transition-all pt-0.5 cursor-pointer relative overflow-hidden group border border-[#1d4ed8]/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </motion.button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
