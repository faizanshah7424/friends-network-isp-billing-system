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

  // Opacity loop variants
  const opacityVariants = {
    animate: {
      opacity: [0.9, 1, 0.9],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Rotation and scale loop variants for normal motion
  const rotationVariants = {
    animate: {
      rotate: [0, 360],
      scale: [1, 1.05, 1],
      transition: {
        rotate: {
          duration: 3,
          repeat: Infinity,
          ease: 'linear' as const,
        },
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        },
      },
    },
  };

  const containerClasses = fullscreen
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white'
    : overlay
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm shadow-xl'
    : `flex flex-col items-center justify-center ${className}`;

  if (!visible) return null;

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Soft Glow Behind Logo */}
        {!shouldReduceMotion && (
          <motion.div
            style={{
              width: size + 24,
              height: size + 24,
            }}
            className="absolute rounded-full bg-blue-500/10 blur-xl pointer-events-none"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Logo Image Wrapper */}
        <motion.div
          style={{ width: size, height: size }}
          className="relative z-10 select-none pointer-events-none"
          variants={opacityVariants}
          animate="animate"
        >
          {shouldReduceMotion ? (
            <img
              src="/friends-logo.png"
              alt="Friends Network Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <motion.img
              src="/friends-logo.png"
              alt="Friends Network Logo animate"
              style={{ width: '100%', height: '100%', objectFit: 'contain', willChange: 'transform' }}
              variants={rotationVariants}
              animate="animate"
            />
          )}
        </motion.div>
      </div>

      {/* Optional Loader Titles */}
      {(text || subtext || loadingText) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mt-6 text-center space-y-1.5"
        >
          {text && (
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {text}
            </h2>
          )}
          {subtext && (
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {subtext}
            </p>
          )}
          {loadingText && (
            <div className="flex items-center justify-center gap-1.5 pt-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
              <p className="text-xs text-slate-500 font-bold tracking-wide min-w-[70px] text-left">
                {loadingText.replace(/\.+$/, '')}{dots}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
