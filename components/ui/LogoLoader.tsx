'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface LogoLoaderProps {
  size?: number;
  className?: string;
  fullscreen?: boolean;
  text?: string;
  subtext?: string;
  loadingText?: string;
  overlay?: boolean;
  delay?: number;
}

export default function LogoLoader({
  size = 64,
  className = '',
  fullscreen = false,
  text,
  subtext,
  loadingText,
  overlay = false,
  delay = 0,
}: LogoLoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = React.useState(delay === 0);
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white'
    : overlay
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm shadow-xl'
    : `flex flex-col items-center justify-center ${className}`;

  if (!visible) return null;

  // Render a compact, infinite rotating version of the premium rainbow ring & pulse
  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        
        {/* Soft Radial Glow */}
        {!shouldReduceMotion && (
          <motion.div
            style={{
              width: size + 36,
              height: size + 36,
            }}
            className="absolute rounded-full bg-blue-500/10 blur-xl pointer-events-none"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* SVG Rainbow Circle Ring */}
        <div style={{ width: size + 24, height: size + 24 }} className="relative z-25 select-none pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <filter id="loader-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="loader-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="25%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="75%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Rotating Rainbow Ring */}
            <motion.circle
              cx={100}
              cy={100}
              r={60}
              stroke="url(#loader-rainbow)"
              strokeWidth={3}
              fill="transparent"
              strokeLinecap="round"
              animate={shouldReduceMotion ? {} : { rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: 'linear',
              }}
              style={{ transformOrigin: '100px 100px' }}
            />

            {/* Glowing Pulse Trail */}
            {!shouldReduceMotion && (
              <>
                <motion.circle
                  cx={100}
                  cy={100}
                  r={60}
                  stroke="#60a5fa"
                  strokeWidth={5}
                  fill="transparent"
                  strokeLinecap="round"
                  filter="url(#loader-glow)"
                  style={{
                    strokeDasharray: '35 342',
                    transformOrigin: '100px 100px',
                  }}
                  animate={{ strokeDashoffset: [0, -377] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    ease: 'linear',
                  }}
                />
                <motion.circle
                  cx={100}
                  cy={100}
                  r={60}
                  stroke="#ffffff"
                  strokeWidth={2}
                  fill="transparent"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: '15 362',
                    transformOrigin: '100px 100px',
                  }}
                  animate={{ strokeDashoffset: [0, -377] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.4,
                    ease: 'linear',
                  }}
                />
              </>
            )}
          </svg>
        </div>

        {/* Center Logo */}
        <div
          style={{ width: size - 4, height: size - 4 }}
          className="absolute z-10 select-none pointer-events-none flex items-center justify-center"
        >
          <img
            src="/friends-logo.png"
            alt="Friends Network Logo"
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.25))',
            }}
          />
        </div>
      </div>

      {/* Optional Loader Titles */}
      {(text || subtext || loadingText) && (
        <div className="mt-6 text-center space-y-1.5 z-20">
          {text && (
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
              {text}
            </h2>
          )}
          {subtext && (
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              {subtext}
            </p>
          )}
          {loadingText && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <span className="h-1 w-1 rounded-full bg-blue-500 animate-ping" />
              <p className="text-xs text-slate-500 font-bold tracking-wide min-w-[70px] text-left">
                {loadingText.replace(/\.+$/, '')}{dots}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
