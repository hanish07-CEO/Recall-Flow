'use client';

import React from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">
              Recall<span className="text-sky-400">Flow</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Privacy-aware voice meeting copilot • Omi + Qdrant + Lyzr
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
          <Link href="/login" className="hover:text-white transition">Sign In</Link>
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
        </div>

        <div className="text-[11px] text-slate-500">
          © {new Date().getFullYear()} RecallFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
