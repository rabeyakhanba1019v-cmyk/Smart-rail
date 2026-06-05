import { motion } from 'framer-motion';
import { Bell, CheckCheck, CheckCircle, XCircle, AlertTriangle, Info, MessageSquare, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { timeAgo } from '../utils/format';
import DashboardLayout from '../components/layout/DashboardLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const typeConfig = {
  success: { icon: <CheckCircle size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  error: { icon: <XCircle size={16} />, color: 'text-red-400', bg: 'bg-red-500/10' },
  warning: { icon: <AlertTriangle size={16} />, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  info: { icon: <Info size={16} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  fraud: { icon: <Shield size={16} />, color: 'text-red-400', bg: 'bg-red-500/10' },
  payment: { icon: <CreditCard size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  chat: { icon: <MessageSquare size={16} />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications(user?.id);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-gray-500 text-sm mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-sm rounded-lg transition-all">
              <CheckCheck size={14} /> Mark All Read
            </button>
          )}
        </motion.div>

        {loading ? (
          <LoadingSpinner />
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={48} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold">All caught up!</p>
            <p className="text-gray-600 text-sm mt-1">No notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const cfg = typeConfig[notif.type as keyof typeof typeConfig] || typeConfig.info;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !notif.read_status && markAsRead(notif.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    !notif.read_status
                      ? 'bg-gray-900/80 border-cyan-500/20 hover:border-cyan-500/40'
                      : 'bg-gray-900/30 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <span className={cfg.color}>{cfg.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${!notif.read_status ? 'text-white' : 'text-gray-300'}`}>
                      {notif.title}
                    </p>
                    <p className="text-gray-500 text-sm leading-relaxed mt-0.5">{notif.message}</p>
                    <p className="text-gray-600 text-xs mt-1.5">{timeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.read_status && (
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0 mt-2" />
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
