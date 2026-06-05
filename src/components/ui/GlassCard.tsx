import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'cyan' | 'emerald' | 'red' | 'yellow' | 'none';
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = '', glow = 'none', hover = false, onClick }: GlassCardProps) {
  const glowMap = {
    cyan: 'border-cyan-500/30 shadow-cyan-500/10',
    emerald: 'border-emerald-500/30 shadow-emerald-500/10',
    red: 'border-red-500/30 shadow-red-500/10',
    yellow: 'border-yellow-500/30 shadow-yellow-500/10',
    none: 'border-white/5',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      onClick={onClick}
      className={`bg-gray-900/50 backdrop-blur-sm border rounded-xl shadow-lg ${glowMap[glow]} ${hover ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
