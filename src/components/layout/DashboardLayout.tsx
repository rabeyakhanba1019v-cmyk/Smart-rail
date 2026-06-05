import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain as Train, LayoutDashboard, Ticket, ShoppingBag, MessageSquare, Bell, User, Shield, Upload, MapPin, AlertTriangle, LogOut, Menu, X, Users, BarChart3, Flag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/marketplace', label: 'Marketplace', icon: <ShoppingBag size={18} /> },
  { href: '/upload', label: 'Sell Ticket', icon: <Upload size={18} /> },
  { href: '/chat', label: 'Messages', icon: <MessageSquare size={18} /> },
  { href: '/meetup', label: 'Smart Meetup', icon: <MapPin size={18} /> },
  { href: '/payment', label: 'Payments', icon: <Ticket size={18} /> },
  { href: '/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { href: '/fraud-report', label: 'Report Fraud', icon: <AlertTriangle size={18} /> },
  { href: '/profile', label: 'Profile', icon: <User size={18} /> },
  { href: '/admin', label: 'Admin Panel', icon: <Shield size={18} />, adminOnly: true },
  { href: '/admin/users', label: 'User Management', icon: <Users size={18} />, adminOnly: true },
  { href: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} />, adminOnly: true },
  { href: '/admin/fraud', label: 'Fraud Monitor', icon: <Flag size={18} />, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, signOut, isAdmin, user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-cyan-500/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center">
            <Train size={16} className="text-gray-950" />
          </div>
          <div>
            <p className="text-white font-bold text-xs leading-tight">BD Railway</p>
            <p className="text-cyan-400 text-xs">Exchange</p>
          </div>
        </Link>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-0.5">
          {visibleItems.map(item => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-gray-500'}>{item.icon}</span>
                {item.label}
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-cyan-500/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950 flex-shrink-0">
            {profile?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm font-medium transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-gray-900/50 border-r border-cyan-500/10 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-cyan-500/10 z-50 flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-cyan-500/10 bg-gray-900/30 flex-shrink-0">
          <button
            className="lg:hidden p-2 text-gray-400 hover:text-cyan-400 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-cyan-400 transition-colors">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to="/profile">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
