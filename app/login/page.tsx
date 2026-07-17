'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoader from '@/components/ui/LogoLoader';
import { useBillingSystem } from '@/lib/context';

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

      // We keep canvas transparent to let the Tailwind CSS radial glows and dark theme background show through.

      // Update & Draw nodes
      ctx.fillStyle = 'rgba(99, 102, 241, 0.4)'; // Indigo dot glow
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0; // reset

      // Connections
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
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

            // Spawn pulse occasionally
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

      // Draw light pulses
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
          ctx.fillStyle = '#10b981'; // Emerald glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
          ctx.fill();
          ctx.shadowBlur = 0; // reset
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none block z-0" />;
};

import { authService } from '@/services/auth';

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
    setIsLoading(true);
    setError(null);

    try {
      // Allow clean username or full email address
      const username = email.includes('@') ? email.split('@')[0] : email;
      const cleanPassword = password || 'shahid123'; // Default fallback if they left unchanged
      
      const res = await authService.login(username, cleanPassword);
      localStorage.setItem('fnb_access_token', res.access_token);
      
      const me = await authService.getMe();
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
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-[#0d0d12] text-slate-100 font-sans relative overflow-y-auto md:overflow-hidden select-none">
      
      {/* Interactive Fiber-Optic Background (spans whole screen behind layout) */}
      <FiberOpticBackground />

      {/* Decorative Blur Blobs for Premium Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full bg-indigo-600/8 blur-[110px] pointer-events-none z-0" />

      {/* LEFT PANEL: Branding & Taglines (Visible on Laptop/Desktop) */}
      <div className="hidden md:flex md:w-1/2 min-h-screen flex-col justify-between p-16 border-r border-white/10 relative z-10 bg-gradient-to-r from-black/60 via-black/30 to-transparent backdrop-blur-[3px]">
        {/* Top Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <img src="/friends-logo.png" alt="Friends Network Logo" className="h-7 w-7 object-contain" />
            </div>
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Friends Network</span>
        </div>

        {/* Core Tagline / Welcome message */}
        <div className="my-auto py-12 text-left space-y-5 max-w-md">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black tracking-tight leading-tight bg-gradient-to-br from-white to-slate-100 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
          >
            Centralized ISP billing &amp; customer operations.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm text-slate-200 leading-relaxed font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          >
            Manage subscribers, record credit ledger transactions, resolve complaints, and view distribution reports in one high-performance dashboard.
          </motion.p>
        </div>

        {/* Security / Quality Assurance footer */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
          <span>Centralized Administration Desk</span>
        </div>
      </div>

      {/* RIGHT PANEL: Modern Login Form Card */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 min-h-screen">
        
        {/* Mobile Header: Branding (Visible only on mobile/tablet) */}
        <div className="md:hidden w-full max-w-[440px] flex flex-col items-center text-center space-y-4 mb-8">
          {/* Logo and title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
                <img src="/friends-logo.png" alt="Friends Network Logo" className="h-7 w-7 object-contain" />
              </div>
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">Friends Network</span>
          </div>

          {/* Tagline / Welcome message */}
          <div className="space-y-2 px-4">
            <h2 className="text-xl font-black text-white tracking-tight leading-tight bg-gradient-to-br from-white to-slate-100 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
              Centralized ISP billing &amp; customer operations.
            </h2>
            <p className="text-xs text-slate-200 leading-relaxed font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
              Manage subscribers, record credit ledger transactions, resolve complaints, and view distribution reports in one high-performance dashboard.
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Signing you in... loading state overlay */
            <motion.div
              key="auth-loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[440px] bg-slate-950/85 border border-white/15 rounded-[24px] p-12 text-center shadow-2xl backdrop-blur-2xl space-y-5 shadow-black/80"
            >
              {/* Rotating logo animation */}
              <div className="relative h-16 w-16 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500"
                />
                <img src="/friends-logo.png" alt="Branding" className="h-10 w-10 absolute inset-0 m-auto object-contain" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-white">Signing you in...</h3>
                <p className="text-xs text-slate-300 font-medium animate-pulse">Validating credentials with secure ISP directories</p>
              </div>
            </motion.div>
          ) : (
            /* Modern Login Card */
            <motion.div
              key="login-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-[440px] bg-slate-950/85 border border-white/15 rounded-[24px] p-8 md:p-10 shadow-2xl backdrop-blur-2xl space-y-6 text-left shadow-black/80"
            >
              <div className="space-y-1.5">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Sign In</h1>
                <p className="text-xs text-indigo-400 font-extrabold uppercase tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Access the billing console</p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 animate-ping" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick Credentials Profiles */}
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-2.5 backdrop-blur-md">
                <span className="text-[10.5px] font-extrabold text-slate-300 uppercase tracking-wider block">Quick Login Profiles</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('muhammad_shahid@friendsnetwork.net');
                      setPassword('shahid123');
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                      email === 'muhammad_shahid@friendsnetwork.net'
                        ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20 font-extrabold'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold truncate">M. Shahid</span>
                      {email === 'muhammad_shahid@friendsnetwork.net' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Super Admin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('noor_jamal@friendsnetwork.net');
                      setPassword('noor123');
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                      email === 'noor_jamal@friendsnetwork.net'
                        ? 'border-emerald-500 bg-emerald-500/20 text-white shadow-lg shadow-emerald-500/20 font-extrabold'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold truncate">Noor Jamal</span>
                      {email === 'noor_jamal@friendsnetwork.net' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Sub Admin</div>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">Administrator Email</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g. shahid@friendsnetwork.net"
                      className="h-12 w-full rounded-xl border border-white/15 bg-black/60 pl-11 pr-4 text-xs md:text-sm text-white placeholder-slate-400 outline-none transition-all hover:border-white/25 focus:border-indigo-400 focus:bg-[#09090b] focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-200">Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter password"
                      className="h-12 w-full rounded-xl border border-white/15 bg-black/60 pl-11 pr-10 text-xs md:text-sm text-white placeholder-slate-400 outline-none transition-all hover:border-white/25 focus:border-indigo-400 focus:bg-[#09090b] focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      defaultChecked 
                      className="rounded text-indigo-500 border-white/20 bg-[#09090b]/80 focus:ring-indigo-500/50 focus:ring-offset-0 h-4 w-4 cursor-pointer" 
                    />
                    <span className="font-semibold text-slate-200">Remember session</span>
                  </label>
                  <a href="#" className="font-extrabold text-indigo-300 hover:text-indigo-200 transition-colors hover:underline">Forgot password?</a>
                </div>

                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  className="w-full flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-600 text-xs md:text-sm font-extrabold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all pt-0.5 cursor-pointer relative overflow-hidden group border border-white/10"
                >
                  <span className="absolute inset-0 bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <span>Sign In to Dashboard</span>
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Security Footer (Visible only on mobile/tablet) */}
        <div className="md:hidden mt-8 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>Centralized Administration Desk</span>
        </div>

      </div>

    </div>
  );
}
