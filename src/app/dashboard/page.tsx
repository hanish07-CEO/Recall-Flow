'use client';

import React, { useState, useEffect } from 'react';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { OmiSimulator } from '@/components/OmiSimulator';
import { AgentWorkflowGraph } from '@/components/AgentWorkflowGraph';
import { ActionItemsKanban } from '@/components/ActionItemsKanban';
import { MemoryExplorer } from '@/components/MemoryExplorer';
import { EvidenceQASearch } from '@/components/EvidenceQASearch';
import { ActionItemRecord } from '@/lib/models/actionItem';
import { MemoryRecord } from '@/lib/models/memory';
import { AgentWorkflowTrace } from '@/lib/models/agent';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [currentUserId, setCurrentUserId] = useState<string>('user-default');
  const [actionItems, setActionItems] = useState<ActionItemRecord[]>([]);
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [workflowTrace, setWorkflowTrace] = useState<AgentWorkflowTrace | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stream' | 'actions' | 'agents' | 'copilot'>('stream');
  const [notification, setNotification] = useState<{ message: string; targetTab: 'actions' | 'agents' } | null>(null);

  // Sync initial role from query or localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam) {
        setCurrentUserId(roleParam);
      } else {
        const stored = localStorage.getItem('recallflow_user_id');
        if (stored) setCurrentUserId(stored);
      }
    }
  }, []);

  // Load data
  const fetchData = async () => {
    try {
      const aiRes = await fetch(`/api/action-items?userId=${currentUserId}`);
      const aiData = await aiRes.json();
      if (aiData.success) {
        setActionItems(aiData.actionItems);
      }

      const scopes = currentUserId === 'user-admin' ? 'public,team,confidential' : 'public,team';
      const memRes = await fetch(`/api/memories?scopes=${scopes}`);
      const memData = await memRes.json();
      if (memData.success) {
        setMemories(memData.memories);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const handleIngestionSuccess = (data: any) => {
    if (data.workflowRun?.trace) {
      setWorkflowTrace(data.workflowRun.trace);
    }
    fetchData();

    if (data.result?.changeDetected) {
      setNotification({
        message: '⚡ Timeline change detected! Priya’s deadline shifted to Friday, Oct 9, 2026.',
        targetTab: 'actions',
      });
    } else {
      setNotification({
        message: 'Transcript processed successfully! All 5 Lyzr agents completed execution.',
        targetTab: 'agents',
      });
    }
  };

  const handleActionItemStatusChange = async (id: string, status: ActionItemRecord['status']) => {
    try {
      const res = await fetch('/api/action-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setActionItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const res = await fetch(`/api/memories?memoryId=${memoryId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMemories((prev) => prev.filter((m) => m.memoryId !== memoryId));
      }
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/system/reset', { method: 'POST' });
      await fetchData();
      setWorkflowTrace(null);
      setNotification(null);
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100">
      {/* Unified Single Navbar */}
      <DashboardNavbar
        currentUserId={currentUserId}
        onUserChange={setCurrentUserId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actionItemsCount={actionItems.length}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Spacious Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Active Notification Banner */}
        {notification && (
          <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-800 text-sm text-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl shadow-sky-950/30 animate-fadeIn">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 shrink-0" />
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => {
                setActiveTab(notification.targetTab);
                setNotification(null);
              }}
              className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shrink-0 cursor-pointer shadow"
            >
              View in {notification.targetTab === 'actions' ? 'Action Items' : 'Agent Pipeline'} →
            </button>
          </div>
        )}

        {/* Tab 1: Voice Meeting Stream */}
        {activeTab === 'stream' && (
          <div className="animate-fadeIn">
            <OmiSimulator
              onIngestionSuccess={handleIngestionSuccess}
              currentUserId={currentUserId}
              onNavigateTab={setActiveTab}
            />
          </div>
        )}

        {/* Tab 2: Action Items & Deltas */}
        {activeTab === 'actions' && (
          <div className="animate-fadeIn">
            <ActionItemsKanban
              actionItems={actionItems}
              onStatusChange={handleActionItemStatusChange}
            />
          </div>
        )}

        {/* Tab 3: Lyzr 5-Agent Pipeline */}
        {activeTab === 'agents' && (
          <div className="animate-fadeIn">
            <AgentWorkflowGraph workflowTrace={workflowTrace} />
          </div>
        )}

        {/* Tab 4: Evidence Copilot & Qdrant Collections */}
        {activeTab === 'copilot' && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Ask RecallFlow */}
              <div>
                <EvidenceQASearch
                  currentUserId={currentUserId}
                  onSearchComplete={(qa) => {
                    if (qa.agentSteps && qa.agentSteps.length > 0) {
                      setWorkflowTrace({
                        traceId: qa.traceId,
                        triggerEventId: 'evt-qa-search',
                        timestamp: new Date().toISOString(),
                        mode: 'demo_simulator',
                        status: 'success',
                        totalDurationMs: qa.agentSteps.reduce(
                          (acc, s) => acc + (s.durationMs || 0),
                          0
                        ),
                        steps: qa.agentSteps,
                      });
                    }
                  }}
                />
              </div>

              {/* Right Column: Qdrant Memory Explorer */}
              <div>
                <MemoryExplorer
                  memories={memories}
                  onDeleteMemory={handleDeleteMemory}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 text-center text-xs text-slate-500">
        <p>
          RecallFlow Dashboard • Voice Ingestion (Omi) • Vector Memory (Qdrant) • Multi-Agent Pipeline (Lyzr)
        </p>
      </footer>
    </div>
  );
}
