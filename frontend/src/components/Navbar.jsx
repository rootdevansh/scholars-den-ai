import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LayoutDashboard, Calendar, BarChart3, Bot, Menu, X } from 'lucide-react';
import useStore from '../store/useStore';

const navLinks = [
  { to: '/plan',      label: 'Plan',      icon: Calendar },
  { to: '/today',     label: 'Today',     icon: BookOpen },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/insights',  label: 'Insights',  icon: BarChart3 },
  { to: '/tutor',     label: 'AI Tutor',  icon: Bot, highlight: true },
];

export default function Navbar() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'backdrop-blur-xl bg-den-bg/90 border-b border-den-border' : 'bg-den-bg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-den-yellow rounded-lg flex items-center justify-center yellow-glow-sm group-hover:scale-105 transition-transform">
              <span className="font-syne font-black text-black text-sm">SD</span>
            </div>
            <span className="font-syne font-bold text-den-text text-lg hidden sm:block">
              Scholar's Den <span className="text-den-yellow">AI</span>
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, highlight }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'text-den-yellow bg-den-yellow/10'
                    : 'text-den-muted hover:text-den-text hover:bg-white/5'
                  }`
                }
              >
                <Icon size={15} />
                {label}
                {highlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-den-yellow pulse-ring absolute top-1.5 right-1.5" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded-lg text-den-muted hover:text-den-text hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-16 left-0 right-0 z-40 md:hidden bg-den-card border-b border-den-border"
          >
            {navLinks.map(({ to, label, icon: Icon, highlight }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-4 text-sm font-medium border-b border-den-border transition-colors
                  ${isActive ? 'text-den-yellow bg-den-yellow/5' : 'text-den-muted hover:text-den-text'}`
                }
              >
                <Icon size={16} />
                {label}
                {highlight && <span className="ml-auto w-2 h-2 rounded-full bg-den-yellow pulse-ring" />}
              </NavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
