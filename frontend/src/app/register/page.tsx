'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Shield, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Salesperson');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const { registerUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      await registerUser({ email, password, name, role });
    } catch (error: any) {
      setErr(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-slate-100 dark:bg-[#0f172a] text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white font-black text-xl mb-4 shadow-lg shadow-blue-500/20">
            G
          </div>
          <h2 className="text-2xl font-display font-extrabold tracking-tight">Request Staff Access</h2>
          <p className="text-xs text-slate-400 mt-1.5">Repeat Order Reminder System</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 shadow-2xl">
          {err && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Nair"
                  required
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Company Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gangamaxx.com"
                  required
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Security Role</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-xs appearance-none focus:bg-[#FFF] dark:focus:bg-[#0F172A]"
                >
                  <option value="Salesperson">Salesperson</option>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Admin">Admin Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Submit Access Request
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <hr className="border-slate-200/40 dark:border-slate-800/40 my-6" />

          <p className="text-center text-xs text-slate-400 font-medium">
            Already have access?{' '}
            <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
