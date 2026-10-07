'use client';

import React from 'react';
import Link from 'next/link';
import { Radio, ArrowLeft, RotateCcw, User, Mic, CheckSquare, Cpu, Search, CheckCircle2 } from 'lucide-react';

interface DashboardNavbarProps {
  currentUserId: string;
  onUserChange: (userId: string) => void;
  activeTab: 'stream' | 'actions' | 'agents' | 'copilot';
  onTabChange: (tab: 'stream' | 'actions' | 'agents' | 'copilot') => void;
  actionItemsCount: number;
  onResetSeed: () => void;
  isResetting: boolean;
}

export const DashboardNavbar: React.FC<DashboardNavbarProps> = ({
  currentUserId,
  onUserChange,
  activeTab,
  onTabChange,
  actionItemsCount,
  onResetSeed,
  isResetting,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Brand & Return to Landing */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20 transition group-hover:scale-105">
              <Radio className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Recall<span className="text-sky-400">Flow</span>
            </span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </Link>
        </div>

        {/* Center: The 4 Primary Workspace Tabs */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-2xl border border-slate-800/80 overflow-x-auto w-full md:w-auto justify-center">
          <button
            type="button"
            onClick={() => onTabChange('stream')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'stream'
                ? 'bg-sky-950 text-sky-300 border border-sky-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-sky-400" />
            <span>Voice Stream</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('actions')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'actions'
                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Action Items</span>
            {actionItemsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-900 text-indigo-300">
                {actionItemsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('agents')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'agents'
                ? 'bg-purple-950 text-purple-300 border border-purple-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Lyzr Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('copilot')}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold transition shrink-0 ${
              activeTab === 'copilot'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Evidence Copilot & Qdrant</span>
          </button>
        </div>

        {/* Right: Role Switcher & Reset */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Role Switcher */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={currentUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="bg-transparent text-slate-200 font-medium border-none outline-none cursor-pointer"
              aria-label="Active Persona Role"
            >
              <option value="user-default" className="bg-slate-900 text-slate-200">
                Team Member (Standard)
              </option>
              <option value="user-admin" className="bg-slate-900 text-purple-300 font-semibold">
                Executive Admin (Confidential)
              </option>
            </select>
          </div>

          {/* Reset Demo State Button */}
          <button
            type="button"
            onClick={onResetSeed}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
            title="Reset Qdrant store to initial seed state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
