'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Boxes, 
  Clock, 
  FileDown, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  User,
  Sun,
  Moon,
  Loader2,
  Sparkles
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, token, router]);

  if (loading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.remove('dark');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  };

  const navItems = [
    { name: 'KPI Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Salesperson', 'Coordinator', 'Dispatcher'] },
    { name: 'Customer CRM', href: '/dashboard/customers', icon: Users, roles: ['Admin', 'Salesperson', 'Coordinator'] },
    { name: 'Product Stock', href: '/dashboard/products', icon: Boxes, roles: ['Admin', 'Coordinator', 'Dispatcher'] },
    { name: 'Reminder Logs', href: '/dashboard/reminders', icon: Clock, roles: ['Admin', 'Coordinator', 'Salesperson'] },
    { name: 'Exports & Reports', href: '/dashboard/reports', icon: FileDown, roles: ['Admin', 'Coordinator', 'Salesperson'] },
    { name: 'Admin Controls', href: '/dashboard/admin', icon: ShieldAlert, roles: ['Admin'] }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-200/40 dark:border-slate-800/40 p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                G
              </div>
              <div>
                <span className="font-display font-extrabold text-xs uppercase tracking-wider block">Ganga Maxx</span>
                <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold block -mt-1">B2B Core System</span>
              </div>
            </div>
            
            <button className="md:hidden p-1.5 rounded-lg" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems
              .filter(item => user && item.roles.includes(user.role))
              .map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={index} href={item.href}>
                    <button 
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/40 text-slate-500 dark:text-slate-400'}`}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* User profile card & Logout */}
        <div className="space-y-4 pt-6 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-3 p-2 bg-slate-200/30 dark:bg-slate-900/30 rounded-2xl border border-slate-200/20 dark:border-slate-800/20">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-black truncate">{user?.name}</span>
              <span className="block text-[9px] text-slate-400 font-bold uppercase truncate">{user?.role}</span>
            </div>
          </div>

          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main View Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="glass-panel-glow border-b border-slate-200/20 dark:border-slate-800/20 px-8 py-4.5 flex items-center justify-between gap-4 rounded-none border-t-0 border-x-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-xl" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 px-3 py-1.5 rounded-xl text-[10px] font-bold text-blue-600 dark:text-blue-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Telangana Logistics Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <button 
              onClick={toggleTheme} 
              className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border border-slate-200/30 dark:border-slate-800/30 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Status indicators */}
            <div className="text-right hidden md:block">
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Operational Status</span>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Connected
              </span>
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
