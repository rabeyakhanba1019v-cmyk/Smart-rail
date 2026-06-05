import { motion } from 'framer-motion';
import { Brain as Train } from 'lucide-react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ fullScreen = false, size = 'md' }: LoadingSpinnerProps) {
  const sizeMap = { sm: 16, md: 24, lg: 40 };
  const s = sizeMap[size];

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className={`w-${s/4 + 8} h-${s/4 + 8} rounded-full border-2 border-cyan-500/20 border-t-cyan-400`}
          style={{ width: s * 1.5, height: s * 1.5 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Train size={s * 0.5} className="text-cyan-400" />
        </div>
      </div>
      {size !== 'sm' && (
        <p className="text-gray-500 text-sm animate-pulse">Loading...</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{spinner}</div>;
}

export function SkeletonCard() {
  return (
    <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-800" />
          <div>
            <div className="h-4 w-24 bg-gray-800 rounded mb-1" />
            <div className="h-3 w-16 bg-gray-800 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-800 rounded" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-20 bg-gray-800 rounded" />
        <div className="flex-1 h-px bg-gray-800" />
        <div className="h-5 w-20 bg-gray-800 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-7 bg-gray-800 rounded-md" />
        <div className="h-7 bg-gray-800 rounded-md" />
      </div>
    </div>
  );
}
