'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio, Shield, User, Lock, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = (userId: string) => {
    setIsLoading(true);
    // Save selected role to localStorage for dashboard
    if (typeof window !== 'undefined') {
      localStorage.setItem('recallflow_user_id', userId);
    }
    setTimeout(() => {
      router.push(`/dashboard?role=${userId}`);
    }, 400);
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSelectRole('user-default');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/20 to-purple-600/20 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/20 ring-1 ring-white/20">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome to Recall<span className="text-sky-400">Flow</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
            Choose a quick demo persona to test privacy boundaries or sign in with email.
          </p>
        </div>

        {/* Demo Persona Cards */}
        <div className="space-y-3">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block text-center">
            Instant Demo Sign-in Personas
          </label>

          {/* Standard Team Member */}
          <button
            type="button"
            onClick={() => handleSelectRole('user-default')}
            disabled={isLoading}
            className="w-full text-left p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-sky-500/80 transition duration-200 group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-950 text-sky-400 border border-sky-800">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Engineering Team Member</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Access to team meetings, caching benchmarks & Qdrant cost context.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition shrink-0 mt-1" />
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-500">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Privacy Shield Active: Confidential executive notes restricted</span>
            </div>
          </button>

          {/* Executive Admin */}
          <button
            type="button"
            onClick={() => handleSelectRole('user-admin')}
            disabled={isLoading}
            className="w-full text-left p-4 rounded-2xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-purple-500/80 transition duration-200 group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Executive / Workspace Admin</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unrestricted privileges including confidential HR & executive compensation.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition shrink-0 mt-1" />
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-purple-400">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Confidential Scope Unlocked: Full audit access</span>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-950 px-3 text-xs text-slate-500 uppercase tracking-wider shrink-0">
            or custom sign-in
          </span>
        </div>

        {/* Custom Sign-in Form */}
        <form onSubmit={handleStandardSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acme.ai"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 shadow-lg shadow-sky-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Continue to Dashboard'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500">
          In Demo Mode, selecting any persona takes you directly to the verified environment.
        </p>
      </div>
    </div>
  );
}
