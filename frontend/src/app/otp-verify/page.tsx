'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

export default function OtpVerifyPage() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [countdown, setCountdown] = useState(59);
  const { verifyOtp } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);

    try {
      await verifyOtp(otp);
    } catch (error: any) {
      setErr(error.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCountdown(59);
    setErr('');
    // Mock resend trigger
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
          <h2 className="text-2xl font-display font-extrabold tracking-tight">Security OTP Check</h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Verify your high-privilege staff session</p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5 mb-6 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 p-3 rounded-xl">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>Enterprise Verification Bypass Code: Enter <strong>123456</strong></span>
          </div>

          {err && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 text-center">Enter 6-Digit Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  required
                  className="w-full glass-input text-center tracking-[1em] text-lg pl-10 pr-4 py-3.5 rounded-xl font-bold font-mono"
                />
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 font-medium">
              {countdown > 0 ? (
                <span>Resend code in <strong className="text-slate-600 dark:text-slate-200">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend OTP Code
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating OTP...
                </>
              ) : (
                <>
                  Verify Session
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
