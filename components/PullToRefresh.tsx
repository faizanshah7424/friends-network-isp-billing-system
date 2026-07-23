'use client';

import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0 || window.scrollY > 0) return;
    const currentY = e.touches[0].clientY;
    const dist = currentY - startY;
    if (dist > 0) {
      setPullDistance(Math.min(dist * 0.4, 100));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);

      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        setStartY(0);
        window.location.reload();
      }, 1000);
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="flex justify-center items-center overflow-hidden transition-all duration-150"
          style={{ height: `${pullDistance}px` }}
        >
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : pullDistance * 3 }}
            transition={{ repeat: isRefreshing ? Infinity : 0, duration: 0.8, ease: 'linear' }}
            className="p-2 rounded-full bg-card border border-border shadow-md text-primary"
          >
            <RefreshCw className="h-5 w-5" />
          </motion.div>
        </div>
      )}
      {children}
    </div>
  );
}
