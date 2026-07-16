'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StartupSplashProps {
  delay?: number;
}

export default function StartupSplash({ delay = 0 }: StartupSplashProps) {
  const [visible, setVisible] = useState(delay === 0);
  const [introComplete, setIntroComplete] = useState(false);

  // Delay visibility trigger
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // Set intro complete to true after 2.8 seconds to trigger the infinite loading loop
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setIntroComplete(true);
    }, 2800);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  // Staggered dots data for STEP 1 (0 to 0.4 sec)
  // 6 dots spaced evenly on a circle of radius 60
  const dots = [
    { cx: 100, cy: 40, color: '#3b82f6' },   // Blue
    { cx: 151.96, cy: 70, color: '#10b981' }, // Green
    { cx: 151.96, cy: 130, color: '#14b8a6' },// Teal
    { cx: 100, cy: 160, color: '#f59e0b' },  // Amber
    { cx: 48.04, cy: 130, color: '#ef4444' }, // Red
    { cx: 48.04, cy: 70, color: '#8b5cf6' },  // Purple
  ];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden select-none"
    >
      {/* Central Ring & Logo Container */}
      <div className="relative flex items-center justify-center w-48 h-48">
        
        {/* Soft Radial Glow behind everything */}
        <motion.div
          className="absolute rounded-full bg-blue-500/10 blur-2xl pointer-events-none"
          style={{ width: 160, height: 160 }}
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

        {/* SVG containing the colored dots, the rainbow ring, and the pulse trail */}
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full relative z-20 pointer-events-none"
        >
          <defs>
            {/* Soft Glow filter */}
            <filter id="glow-filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Rainbow Outline Gradient */}
            <linearGradient id="rainbow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="25%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* STEP 1: Six colored dots appearing one by one clockwise, then fading as the ring draws */}
          {dots.map((dot, idx) => (
            <motion.circle
              key={idx}
              cx={dot.cx}
              cy={dot.cy}
              r={4.5}
              fill={dot.color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1, 1, 0],
                opacity: [0, 1, 1, 1, 0],
              }}
              transition={{
                duration: 0.7,
                delay: idx * 0.066, // Staggered clock-wise intro (0-0.4s)
                times: [0, 0.25, 0.5, 0.75, 1], // Stays full opacity briefly then dissolves as ring draws
                ease: 'easeInOut',
              }}
              style={{
                filter: `drop-shadow(0 0 4px ${dot.color}aa)`,
              }}
            />
          ))}

          {/* STEP 2 & LOADING LOOP: Rainbow Ring Outline */}
          <motion.circle
            cx={100}
            cy={100}
            r={60}
            stroke="url(#rainbow-grad)"
            strokeWidth={3}
            fill="transparent"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={
              introComplete
                ? {
                    pathLength: 1,
                    rotate: 360,
                    transition: {
                      rotate: {
                        repeat: Infinity,
                        duration: 7,
                        ease: 'linear',
                      },
                    },
                  }
                : {
                    pathLength: 1,
                    transition: {
                      delay: 0.4, // STEP 2 (0.4 - 0.8s)
                      duration: 0.4,
                      ease: 'easeInOut',
                    },
                  }
            }
            style={{
              transformOrigin: '100px 100px',
            }}
          />

          {/* STEP 3 & LOADING LOOP: Fiber Optic Pulse (Soft Glow Trail) */}
          <motion.circle
            cx={100}
            cy={100}
            r={60}
            stroke="#60a5fa"
            strokeWidth={5}
            fill="transparent"
            strokeLinecap="round"
            filter="url(#glow-filter)"
            style={{
              strokeDasharray: '45 332',
              transformOrigin: '100px 100px',
            }}
            initial={{ strokeDashoffset: 0, opacity: 0 }}
            animate={
              introComplete
                ? {
                    opacity: 0.6,
                    strokeDashoffset: [0, -377],
                    transition: {
                      strokeDashoffset: {
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'linear',
                      },
                      opacity: { duration: 0.2 },
                    },
                  }
                : {
                    opacity: [0, 0.75, 0.75, 0],
                    strokeDashoffset: [0, -377],
                    transition: {
                      delay: 0.8, // STEP 3 (0.8 - 1.4s)
                      duration: 0.6,
                      times: [0, 0.15, 0.85, 1],
                      ease: 'easeInOut',
                    },
                  }
            }
          />

          {/* STEP 3 & LOADING LOOP: Fiber Optic Pulse (Bright Core) */}
          <motion.circle
            cx={100}
            cy={100}
            r={60}
            stroke="#ffffff"
            strokeWidth={2}
            fill="transparent"
            strokeLinecap="round"
            style={{
              strokeDasharray: '20 357',
              transformOrigin: '100px 100px',
            }}
            initial={{ strokeDashoffset: 0, opacity: 0 }}
            animate={
              introComplete
                ? {
                    opacity: 1,
                    strokeDashoffset: [0, -377],
                    transition: {
                      strokeDashoffset: {
                        repeat: Infinity,
                        duration: 1.5,
                        ease: 'linear',
                      },
                      opacity: { duration: 0.2 },
                    },
                  }
                : {
                    opacity: [0, 1, 1, 0],
                    strokeDashoffset: [0, -377],
                    transition: {
                      delay: 0.8, // STEP 3 (0.8 - 1.4s)
                      duration: 0.6,
                      times: [0, 0.15, 0.85, 1],
                      ease: 'easeInOut',
                    },
                  }
            }
          />
        </svg>

        {/* STEP 4: Centered Friends Network Logo */}
        <motion.div
          className="absolute z-10"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: {
              delay: 1.4, // STEP 4 (1.4 - 2.0s)
              duration: 0.6,
              ease: 'easeOut',
            },
          }}
        >
          <img
            src="/friends-logo.png"
            alt="Friends Network Logo"
            className="h-20 w-20 object-contain"
            style={{
              filter: 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.35))',
            }}
          />
        </motion.div>
      </div>

      {/* Brand & Loading Info text */}
      <div className="mt-8 text-center space-y-2 relative z-30">
        {/* STEP 5: Title Text */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: 2.0, // STEP 5 (2.0 - 2.4s)
              duration: 0.4,
              ease: 'easeOut',
            },
          }}
          className="text-2xl font-black text-slate-800 tracking-tight"
        >
          Friends Network
        </motion.h1>

        {/* STEP 6: Tagline and Subtext */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              delay: 2.4, // STEP 6 (2.4 - 2.8s)
              duration: 0.4,
              ease: 'easeOut',
            },
          }}
          className="space-y-1"
        >
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
            Internet Service Provider
          </p>
          <p className="text-[9px] text-slate-400 font-semibold tracking-wide">
            Fiber To Home &amp; Offices
          </p>
        </motion.div>

        {/* Optional status dots, only shown if loading takes longer */}
        {introComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-2 pt-6"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            <p className="text-[11px] text-slate-500 font-bold tracking-wide min-w-[70px] text-left">
              Loading...
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
