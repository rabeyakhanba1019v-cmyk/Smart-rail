import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  positive?: boolean;
  color?: 'cyan' | 'emerald' | 'yellow' | 'red';
}

const colorMap = {
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
  red: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
};

export default function StatCard({ label, value, icon, change, positive = true, color = 'cyan' }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium">{label}</p>
        <span className={colorMap[color].split(' ').pop()}>{icon}</span>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{change} from last month
        </p>
      )}
    </motion.div>
  );
}
