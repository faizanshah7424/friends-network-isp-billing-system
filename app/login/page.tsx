'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
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

    const nodeCount = 35;
    const nodes: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.5,
      });
    }

    const pulses: { from: number; to: number; progress: number; speed: number }[] = [];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Soft mesh background gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, Math.max(width, height));
      bgGrad.addColorStop(0, '#ffffff');
      bgGrad.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Update & Draw nodes
      ctx.fillStyle = 'rgba(99, 102, 241, 0.35)'; // Indigo
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connections
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
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
            if (Math.random() < 0.0004 && pulses.length < 12) {
              pulses.push({
                from: i,
                to: j,
                progress: 0,
                speed: Math.random() * 0.012 + 0.006,
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
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981'; // Emerald glow
          ctx.shadowBlur = 8;
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none block" />;
};

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useBillingSystem();
  const [email, setEmail] = useState('shahid@friendsnetwork.net');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication verification
    setTimeout(() => {
      setIsLoading(false);
      setIsRedirecting(true);

      // Post-auth redirection delay for loader splash
      setTimeout(() => {
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
      }, 1500);
    }, 1500);
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
    <div className="min-h-screen w-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* LEFT PANEL: Branding & Interactive Background */}
      <div className="relative md:w-1/2 min-h-[30vh] md:min-h-screen flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-slate-200 bg-white overflow-hidden">
        {/* Animated canvas network background */}
        <FiberOpticBackground />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 p-0.5 shadow-md shadow-indigo-500/10">
            <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center">
              <img src="/friends-logo.png" alt="Friends Network Logo" className="h-7 w-7 object-contain" />
            </div>
          </div>
          <span className="font-extrabold text-lg text-slate-800 tracking-tight">Friends Network</span>
        </div>

        {/* Core Tagline / Welcome message */}
        <div className="relative z-10 my-auto py-12 text-left space-y-4 max-w-md">
          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black text-slate-850 tracking-tight leading-tight"
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
        <div className="relative z-10 flex items-center gap-1.5 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
          <span>Centralized Administration Desk</span>
        </div>
      </div>

      {/* RIGHT PANEL: Modern Login Form */}
      <div className="md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-slate-50 relative">
        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Signing you in... loading state overlay */
            <motion.div
              key="auth-loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[400px] bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xl space-y-5"
            >
              {/* Rotating logo animation */}
              <div className="relative h-16 w-16 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-600"
                />
                <img src="/friends-logo.png" alt="Branding" className="h-10 w-10 absolute inset-0 m-auto object-contain" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-800">Signing you in...</h3>
                <p className="text-xs text-slate-400 font-medium">Validating credentials with secure ISP directories</p>
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
              className="w-full max-w-[400px] bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl space-y-6 text-left"
            >
              <div className="space-y-1">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sign In</h1>
                <p className="text-xs text-slate-450 font-bold uppercase tracking-wider">Access the billing console</p>
              </div>

              {/* Quick Credentials Profiles */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Login Profiles</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('shahid@friendsnetwork.net');
                      setPassword('shahid-pass');
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                      email === 'shahid@friendsnetwork.net'
                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600'
                        : 'border-slate-200 hover:bg-slate-100/50 text-slate-600 bg-white'
                    }`}
                  >
                    <div className="font-extrabold truncate">M. Shahid</div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Super Admin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('noor@friendsnetwork.net');
                      setPassword('noor-pass');
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                      email === 'noor@friendsnetwork.net'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600'
                        : 'border-slate-200 hover:bg-slate-100/50 text-slate-600 bg-white'
                    }`}
                  >
                    <div className="font-extrabold truncate">Noor Jamal</div>
                    <div className="text-[9px] font-semibold text-slate-400 mt-0.5">Sub Admin</div>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Administrator Email</label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. shahid@friendsnetwork.net"
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-4 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Password</label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-10.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-10 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-500 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-indigo-600 border-slate-250 focus:ring-indigo-500 h-4 w-4" />
                    <span>Remember session</span>
                  </label>
                  <a href="#" className="font-bold text-indigo-600 hover:underline">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  className="w-full flex h-10.5 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-all pt-0.5"
                >
                  <span>Sign In to Dashboard</span>
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
