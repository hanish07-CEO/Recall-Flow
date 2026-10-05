import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Database,
  LayoutDashboard,
  Menu,
  Mic,
  Search,
  Settings,
  Shield,
  Workflow,
  X,
} from 'lucide-react';
import { AppRoute, useRecallFlow } from '../context/RecallFlowContext';
import { OmiConnectionStatus } from '../types/recallflow';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { MemoryDetailModal } from './MemoryDetailModal';

const NAV_ITEMS: {
  route: AppRoute;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { route: '/', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
  {
    route: '/capture',
    label: 'Capture & Ingestion',
    shortLabel: 'Capture',
    icon: Mic,
  },
  { route: '/ask', label: 'Ask Memory', shortLabel: 'Ask Memory', icon: Search },
  {
    route: '/actions',
    label: 'Action Items',
    shortLabel: 'Actions',
    icon: CheckCircle2,
  },
  {
    route: '/memories',
    label: 'Memory Explorer',
    shortLabel: 'Memories',
    icon: Database,
  },
  {
    route: '/settings',
    label: 'Privacy & Settings',
    shortLabel: 'Settings',
    icon: Settings,
  },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentRoute,
    navigate,
    workspaceContext,
    setWorkspaceContext,
    settings,
    updateSettings,
    metrics,
    simulateQuickOmiEvent,
    isIngesting,
    isArchitectureModalOpen,
    setIsArchitectureModalOpen,
    inspectedMemory,
    setInspectedMemoryId,
  } = useRecallFlow();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cycleOmiStatus = () => {
    const order: OmiConnectionStatus[] = [
      'Demo mode',
      'Omi connected',
      'Webhook unavailable',
    ];
    const nextIdx = (order.indexOf(settings.omiConnectionStatus) + 1) % order.length;
    updateSettings({ omiConnectionStatus: order[nextIdx] });
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-800/90 bg-[#0E1322] lg:flex">
        <div>
          {/* Brand Lockup */}
          <div className="border-b border-slate-800/90 px-6 py-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-lg font-bold tracking-tight text-white">
                  RecallFlow
                </div>
                <div className="text-[11px] text-slate-400">
                  Voice-First Agentic Memory
                </div>
              </div>
            </button>
          </div>

          {/* Workspace Selector */}
          <div className="border-b border-slate-800/80 px-4 py-4">
            <label
              htmlFor="sidebar-workspace-select"
              className="block text-[11px] font-medium text-slate-400"
            >
              Active Memory Context
            </label>
            <select
              id="sidebar-workspace-select"
              value={workspaceContext}
              onChange={(e) =>
                setWorkspaceContext(
                  e.target.value as 'Engineering Workspace' | 'Personal Vault (Private)'
                )
              }
              className="mt-1.5 w-full rounded-lg border border-slate-700/80 bg-[#111827] px-3 py-2 text-xs font-medium text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Engineering Workspace">Engineering Workspace</option>
              <option value="Personal Vault (Private)">Personal Vault (Private)</option>
            </select>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Shield className="h-3.5 w-3.5 text-teal-400" />
              <span>
                Policy: {settings.defaultPrivacy} · {settings.defaultRetention}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3 py-4" aria-label="Sidebar Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? 'text-indigo-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.route === '/actions' && metrics.openActionItems > 0 && (
                    <span className="font-mono text-[11px] tabular-nums text-slate-400">
                      {metrics.openActionItems}
                    </span>
                  )}
                  {item.route === '/memories' && (
                    <span className="font-mono text-[11px] tabular-nums text-slate-400">
                      {metrics.memoriesStored}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Stack Status */}
        <div className="border-t border-slate-800/90 p-4 space-y-3">
          <div className="rounded-lg border border-slate-800 bg-[#111827] p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Omi Input</span>
              <button
                type="button"
                onClick={cycleOmiStatus}
                title="Click to cycle Omi connection state"
                className={`font-medium transition-colors ${
                  settings.omiConnectionStatus === 'Omi connected'
                    ? 'text-teal-400'
                    : settings.omiConnectionStatus === 'Demo mode'
                      ? 'text-indigo-300'
                      : 'text-amber-400'
                }`}
              >
                {settings.omiConnectionStatus}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Vector Store</span>
              <span className="font-mono text-[11px] text-teal-400">Qdrant (Active)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Orchestrator</span>
              <span className="font-mono text-[11px] text-indigo-300">Lyzr (6 Agents)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsArchitectureModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap"
          >
            <Workflow className="h-3.5 w-3.5 text-indigo-400" />
            <span>View System Architecture</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar Contract */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800/90 bg-[#0B0F19]/95 px-4 py-3.5 backdrop-blur-xs sm:px-8">
          {/* Zone 1: Brand / Context Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-800 lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="font-display text-base font-bold tracking-tight text-white"
            >
              RecallFlow
            </button>
          </div>

          {/* Zone 2: Clean Single-Line Text Navigation Links (Desktop) */}
          <nav
            className="hidden xl:flex items-center gap-6 text-xs font-medium text-slate-400"
            aria-label="Top Navigation"
          >
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => navigate(item.route)}
                className={`transition-colors whitespace-nowrap hover:text-white ${
                  currentRoute === item.route
                    ? 'text-white underline decoration-indigo-500 decoration-2 underline-offset-8'
                    : ''
                }`}
              >
                {item.shortLabel}
              </button>
            ))}
          </nav>

          {/* Zone 3: 1-2 Primary Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={simulateQuickOmiEvent}
              disabled={isIngesting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60 whitespace-nowrap"
            >
              <Mic className="h-3.5 w-3.5" />
              <span>{isIngesting ? 'Processing Voice Event...' : 'Simulate Omi Voice Event'}</span>
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-800 bg-[#0E1322] px-4 py-4 lg:hidden">
            <div className="mb-3">
              <label
                htmlFor="mobile-workspace-select"
                className="block text-xs text-slate-400"
              >
                Workspace Context
              </label>
              <select
                id="mobile-workspace-select"
                value={workspaceContext}
                onChange={(e) =>
                  setWorkspaceContext(
                    e.target.value as
                      | 'Engineering Workspace'
                      | 'Personal Vault (Private)'
                  )
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 text-xs text-white"
              >
                <option value="Engineering Workspace">Engineering Workspace</option>
                <option value="Personal Vault (Private)">Personal Vault (Private)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => {
                      navigate(item.route);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Contextual Status Strip */}
        <div className="border-b border-slate-800/70 bg-[#0E1322]/70 px-4 py-2 text-xs text-slate-400 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-200">{workspaceContext}</span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-300">Demo Mode</span>
              <span aria-hidden="true">·</span>
              <span>
                Omi Status:{' '}
                <strong
                  className={
                    settings.omiConnectionStatus === 'Omi connected'
                      ? 'text-teal-400 font-medium'
                      : settings.omiConnectionStatus === 'Demo mode'
                        ? 'text-indigo-300 font-medium'
                        : 'text-amber-400 font-medium'
                  }
                >
                  {settings.omiConnectionStatus}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Privacy Policy:{' '}
                <strong className="text-teal-300 font-medium">
                  {settings.defaultPrivacy} ({settings.defaultRetention} retention)
                </strong>
              </span>
            </div>

            <div className="text-slate-400 hidden sm:block">
              Turn spoken work into lasting context and accountable action.
            </div>
          </div>
        </div>

        {/* Page Viewport */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>

      {/* System Architecture Modal */}
      {isArchitectureModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="System Architecture"
        >
          <div className="my-8 w-full max-w-5xl rounded-xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                About RecallFlow Architecture
              </h2>
              <button
                type="button"
                onClick={() => setIsArchitectureModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ArchitectureDiagram />
          </div>
        </div>
      )}

      {/* Memory Inspector Modal */}
      <MemoryDetailModal
        memory={inspectedMemory}
        onClose={() => setInspectedMemoryId(null)}
      />
    </div>
  );
};
