'use client';

import React from 'react';
import { Shield, Database, Cpu, Radio, RotateCcw, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  systemStatus: any;
  currentUserId: string;
  onUserChange: (userId: string) => void;
  onResetSeed: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  currentUserId,
  onUserChange,
  onResetSeed,
  isResetting,
}) => {
  const omi = systemStatus?.integrations?.omi;
  const qdrant = systemStatus?.integrations?.qdrant;
  const lyzr = systemStatus?.integrations?.lyzr;
  const isDemo = systemStatus?.mode === 'demo';

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/20">
            <Radio className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Recall<span className="text-sky-400">Flow</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Privacy-aware voice memory copilot • Omi + Qdrant + Lyzr
            </p>
          </div>
        </div>

        {/* Integration Status Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Omi Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Omi:</span>
            <span className="text-slate-200 font-medium">{omi?.label || 'Simulator Ready'}</span>
          </div>

          {/* Qdrant Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Qdrant:</span>
            <span className="text-slate-200 font-medium">{qdrant?.label || 'In-Memory Store'}</span>
          </div>

          {/* Lyzr Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Lyzr:</span>
            <span className="text-slate-200 font-medium">5-Agent Engine</span>
          </div>

          {/* User Role Switcher for Privacy Verification */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Role:</span>
            <select
              value={currentUserId}
              onChange={(e) => onUserChange(e.target.value)}
              className="bg-transparent text-slate-200 font-medium border-none outline-none cursor-pointer focus:ring-0"
              aria-label="Active user role"
            >
              <option value="user-default" className="bg-slate-900 text-slate-200">
                Team Member (Standard)
              </option>
              <option value="user-admin" className="bg-slate-900 text-purple-300 font-semibold">
                Executive / Admin (Confidential)
              </option>
            </select>
          </div>

          {/* Reset State Button */}
          <button
            onClick={onResetSeed}
            disabled={isResetting}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition disabled:opacity-50"
            title="Reset repository to baseline seed memories"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
