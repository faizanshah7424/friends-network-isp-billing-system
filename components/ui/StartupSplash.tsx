'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface StartupSplashProps {
  delay?: number;
}

export default function StartupSplash({ delay = 0 }: StartupSplashProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [dots, setDots] = useState('');
  const [visible, setVisible] = useState(delay === 0);

  // Delay visibility trigger
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }
  }, [delay]);

  // Animate dots in 'Loading...'
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas || shouldReduceMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Network Node representation
    class NetNode {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Slow elegant movement
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = (Math.random() - 0.5) * 0.35;
        this.radius = Math.random() * 2.5 + 1.5;
        this.pulse = Math.random() * Math.PI;
        this.pulseSpeed = Math.random() * 0.02 + 0.005;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += this.pulseSpeed;

        // Bounce boundaries
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw(context: CanvasRenderingContext2D) {
        const glow = Math.sin(this.pulse) * 0.4 + 0.6;
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(37, 99, 235, ${glow * 0.75})`; // Royal Blue node
        context.fill();

        // Outer subtle glow ring
        context.beginPath();
        context.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        context.fillStyle = `rgba(56, 189, 248, ${glow * 0.2})`; // Sky Blue glow
        context.fill();
      }
    }

    // Initialize Network Nodes
    const nodeCount = Math.min(65, Math.floor((width * height) / 24000));
    const nodes: NetNode[] = Array.from({ length: nodeCount }, () => new NetNode());

    // Active Data Packets array
    let activePackets: {
      nodeA: NetNode;
      nodeB: NetNode;
      progress: number;
      speed: number;
    }[] = [];

    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Create a soft light blue background gradient blob in the center
      const radialGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.5
      );
      radialGrad.addColorStop(0, '#ffffff');
      radialGrad.addColorStop(0.7, '#f8fafc'); // Soft slate-50 background
      radialGrad.addColorStop(1, '#eff6ff');   // Light blue tint towards edges
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Soft blurred network blobs (waves)
      const time = Date.now() * 0.0005;
      ctx.beginPath();
      ctx.arc(
        width * 0.25 + Math.sin(time) * 40,
        height * 0.35 + Math.cos(time * 0.8) * 30,
        280,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(56, 189, 248, 0.03)'; // Sky blue blurred blob
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        width * 0.75 + Math.cos(time * 0.7) * 50,
        height * 0.65 + Math.sin(time * 0.9) * 40,
        320,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(37, 99, 235, 0.02)'; // Royal blue blurred blob
      ctx.fill();

      // Draw Connection Lines between close nodes & periodically spawn packets
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Connection limit
          if (dist < 155) {
            const alpha = (1 - dist / 155) * 0.18;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 0.65;
            ctx.stroke();

            // Periodic data packet spawn along this connection path (internet traffic simulation)
            if (Math.random() < 0.0015 && activePackets.length < 25) {
              activePackets.push({
                nodeA: nodes[i],
                nodeB: nodes[j],
                progress: 0,
                speed: Math.random() * 0.015 + 0.008,
              });
            }
          }
        }
      }

      // Draw & Update active packets
      activePackets = activePackets.filter((p) => {
        p.progress += p.speed;
        if (p.progress >= 1) return false;

        const px = p.nodeA.x + (p.nodeB.x - p.nodeA.x) * p.progress;
        const py = p.nodeA.y + (p.nodeB.y - p.nodeA.y) * p.progress;

        // Draw glowing light packet (packet core + pulse halo)
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.95)'; // Sky blue packet
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)'; // Glow halo
        ctx.fill();

        return true;
      });

      // Update & Draw Nodes
      nodes.forEach((node) => {
        node.update();
        node.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [shouldReduceMotion]);

  // Framer Motion parameters for high-performance animations
  const logoVariants = {
    animate: {
      rotate: shouldReduceMotion ? 0 : 360,
      scale: shouldReduceMotion ? 1 : [1, 1.04, 1],
      y: shouldReduceMotion ? 0 : [0, -8, 0],
      transition: {
        rotate: {
          duration: 4,
          repeat: Infinity,
          ease: 'linear' as const,
        },
        scale: {
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        },
        y: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        },
      },
    },
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
      transition={{ duration: 0.75, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden select-none"
    >
      {/* Interactive connection canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Floating brand center */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Soft radial blue glow */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full bg-blue-500/10 blur-2xl pointer-events-none"
            style={{ width: 140, height: 140 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Brand logo container */}
        <motion.div
          variants={logoVariants}
          animate="animate"
          className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-white/40 shadow-xl border border-white/50 backdrop-blur-sm p-3.5"
        >
          <img
            src="/friends-logo.png"
            alt="Friends Network Logo"
            className="h-full w-full object-contain pointer-events-none select-none"
          />
        </motion.div>

        {/* Animated Brand Typography */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-8 space-y-2 animate-none"
        >
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Friends Network
          </h1>
          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest leading-none">
            Internet Service Provider
          </p>
          <div className="flex items-center justify-center gap-2 pt-6">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
            <p className="text-[11px] text-slate-500 font-bold tracking-wide min-w-[70px] text-left">
              Loading{dots}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
