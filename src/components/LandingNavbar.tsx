'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, Sparkles, ArrowRight, Shield } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20 transition group-hover:scale-105">
            <Radio className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Recall<span className="text-sky-400">Flow</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#architecture" className="hover:text-white transition">Multi-Agent Workflow</a>
          <a href="#privacy" className="hover:text-white transition">Privacy Shield</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
          >
            Log in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 shadow-lg shadow-sky-500/25 transition group cursor-pointer"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};
