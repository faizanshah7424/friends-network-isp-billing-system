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

      // Update & Draw nodes
      ctx.fillStyle = 'rgba(99, 102, 241, 0.5)'; // Indigo dot glow
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
      ctx.shadowBlur = 0; // reset

      // Connections
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
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
          ctx.fillStyle = '#059669'; // Emerald glow
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#059669';
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
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-slate-50 text-slate-900 font-sans relative overflow-y-auto md:overflow-hidden select-none">
      
      {/* Interactive Fiber-Optic Background */}
      <FiberOpticBackground />

      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none z-0" />

      {/* LEFT PANEL: Branding & Taglines */}
      <div className="hidden md:flex md:w-1/2 min-h-screen flex-col justify-between p-16 border-r border-slate-200/60 relative z-10 bg-gradient-to-r from-white/70 via-slate-50/40 to-transparent backdrop-blur-[2px]">
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
        <div className="my-auto py-12 text-left space-y-5 max-w-md">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-slate-900"
          >
            Centralized ISP billing &amp; customer operations.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm text-slate-500 leading-relaxed font-medium"
          >
            Manage subscribers, record credit ledger transactions, resolve complaints, and view distribution reports in one high-performance dashboard.
          </motion.p>
        </div>

        {/* Security / Quality Assurance footer */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>Centralized Administration Desk</span>
        </div>
      </div>

      {/* RIGHT PANEL: Modern Login Form Card */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 md:p-12 relative z-10 min-h-screen">
        
        {/* Mobile Header: Branding */}
        <div className="md:hidden w-full max-w-[440px] flex flex-col items-center text-center space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-md">
              <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
                <img src="/friends-logo.png" alt="Friends Network Logo" className="h-7 w-7 object-contain" />
              </div>
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">Friends Network</span>
          </div>

          <div className="space-y-2 px-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              Centralized ISP billing &amp; customer operations.
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
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
              className="w-full max-w-[440px] bg-white border border-slate-200 rounded-[24px] p-12 text-center shadow-xl shadow-slate-100/50 space-y-5"
            >
              {/* Rotating logo animation */}
              <div className="relative h-16 w-16 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-blue-100 border-t-blue-600"
                />
                <img src="/friends-logo.png" alt="Branding" className="h-10 w-10 absolute inset-0 m-auto object-contain" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900">Signing you in...</h3>
                <p className="text-xs text-slate-500 font-medium animate-pulse">Validating credentials with secure ISP directories</p>
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
              className="w-full max-w-[440px] bg-white border border-slate-200 rounded-[24px] p-8 md:p-10 shadow-xl shadow-slate-100/50 space-y-6 text-left"
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
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
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
                    onClick={() => {
                      setEmail('noor_jamal@friendsnetwork.net');
                      setPassword('noor123');
                      setError(null);
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                      email === 'noor_jamal@friendsnetwork.net'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-sm font-extrabold'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
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
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="e.g. shahid@friendsnetwork.net"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-xs md:text-sm text-slate-900 placeholder-slate-500 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter password"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-xs md:text-sm text-slate-900 placeholder-slate-500 outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
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
                  className="w-full flex h-12 items-center justify-center rounded-xl bg-blue-600 text-xs md:text-sm font-extrabold text-white shadow-md hover:bg-blue-700 transition-all pt-0.5 cursor-pointer relative overflow-hidden group border border-blue-700"
                >
                  <span>Sign In to Dashboard</span>
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Security Footer */}
        <div className="md:hidden mt-8 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>Centralized Administration Desk</span>
        </div>

      </div>

    </div>
  );
}
