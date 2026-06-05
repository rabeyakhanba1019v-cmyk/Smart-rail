import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain as Train, Bell, MessageSquare, User, Menu, X, Shield, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

export default function Navbar() {
  const { user, profile, signOut, isAdmin } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-950/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-cyan-400/50 transition-all">
                <Train size={18} className="text-gray-950" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="text-white font-bold text-sm leading-tight">Bangladesh Railway</span>
              <span className="block text-cyan-400 text-xs font-medium">Exchange</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-cyan-400 ${
                  location.pathname === link.href ? 'text-cyan-400' : 'text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-colors">
                    <Shield size={16} /> Admin
                  </Link>
                )}
                <Link to="/chat" className="relative p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                  <MessageSquare size={20} />
                </Link>
                <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/30 hover:border-cyan-400/60 transition-all bg-cyan-500/5 hover:bg-cyan-500/10"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xs font-bold text-gray-950">
                      {profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-200 hidden sm:block max-w-24 truncate">{profile?.name || 'User'}</span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-900 border border-cyan-500/20 rounded-xl shadow-xl shadow-black/40 overflow-hidden"
                        onMouseLeave={() => setDropdownOpen(false)}
                      >
                        <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                          <User size={16} /> Dashboard
                        </Link>
                        <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                          <User size={16} /> Profile
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors">
                            <Shield size={16} /> Admin Panel
                          </Link>
                        )}
                        <hr className="border-cyan-500/10" />
                        <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full">
                          <LogOut size={16} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors px-3 py-1.5">
                  Sign In
                </Link>
                <Link to="/register" className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 px-4 py-1.5 rounded-lg transition-all shadow-lg shadow-cyan-500/25">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button className="md:hidden p-2 text-gray-400 hover:text-cyan-400 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-cyan-500/20"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navLinks.map(link => (
                <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} className="px-3 py-2 text-gray-300 hover:text-cyan-400 text-sm font-medium">
                  {link.label}
                </Link>
              ))}
              {!user && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="px-3 py-2 text-gray-300 hover:text-cyan-400 text-sm font-medium">Sign In</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="mt-1 text-center text-sm font-medium bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-950 px-4 py-2 rounded-lg">Get Started</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
