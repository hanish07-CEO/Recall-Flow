import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  DEFAULT_INTEGRATION_CONFIG,
  DEFAULT_PRIVACY_SETTINGS,
  PRIMARY_USER_STORY_TRANSCRIPT,
  SEED_ACTION_ITEMS,
  SEED_MEMORIES,
  SEED_RECENT_AGENT_TRACES,
  SEED_TRANSIENT_AUDIT_LOG,
} from '../data/seedData';
import { RecallFlowApiService } from '../services/api';
import { getActionUrgency } from '../services/recallflowEngine';
import {
  ActionItem,
  ActionStatus,
  AgentTrace,
  IngestionResult,
  IntegrationConfigStatus,
  MemoryRecord,
  OmiConnectionStatus,
  PrivacyAndMemorySettings,
  PrivacyScope,
  ProcessingStageId,
  QueryFilters,
  QueryResponse,
  RetentionPolicy,
} from '../types/recallflow';

export type AppRoute = '/' | '/capture' | '/ask' | '/actions' | '/memories' | '/settings';

interface RecallFlowContextType {
  currentRoute: AppRoute;
  navigate: (route: AppRoute) => void;
  workspaceContext: 'Engineering Workspace' | 'Personal Vault (Private)';
  setWorkspaceContext: (ws: 'Engineering Workspace' | 'Personal Vault (Private)') => void;
  memories: MemoryRecord[];
  transientAuditLog: MemoryRecord[];
  actionItems: ActionItem[];
  recentAgentTraces: AgentTrace[];
  settings: PrivacyAndMemorySettings;
  updateSettings: (partial: Partial<PrivacyAndMemorySettings>) => void;
  integrationConfig: IntegrationConfigStatus;
  // Metrics
  metrics: {
    memoriesStored: number;
    openActionItems: number;
    itemsDueSoon: number;
    voiceSessionsThisWeek: number;
  };
  // Ingestion state
  isIngesting: boolean;
  activeStageIndex: number;
  liveAgentTraces: AgentTrace[];
  lastIngestionResult: IngestionResult | null;
  triggerIngestion: (params: {
    transcript: string;
    sessionName?: string;
    sessionId?: string;
    privacyScope: PrivacyScope;
    retentionPolicy: RetentionPolicy;
    navigateToCapture?: boolean;
  }) => Promise<void>;
  simulateQuickOmiEvent: () => Promise<void>;
  // Ask Memory state
  activeQueryText: string;
  setActiveQueryText: (q: string) => void;
  queryFilters: QueryFilters;
  setQueryFilters: React.Dispatch<React.SetStateAction<QueryFilters>>;
  isQuerying: boolean;
  queryResult: QueryResponse | null;
  runQuery: (questionOverride?: string, navigateToAsk?: boolean) => Promise<void>;
  // Actions & Memories mutations
  updateActionStatus: (actionItemId: string, status: ActionStatus) => Promise<void>;
  deleteMemoryRecord: (memoryId: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  // Architecture & Memory inspection modals
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;
  inspectedMemory: MemoryRecord | null;
  setInspectedMemoryId: (memoryId: string | null) => void;
}

const STORAGE_KEYS = {
  MEMORIES: 'recallflow_demo_memories_v1',
  ACTIONS: 'recallflow_demo_actions_v1',
  SETTINGS: 'recallflow_demo_settings_v1',
  TRANSIENT: 'recallflow_demo_transient_v1',
};

const RecallFlowContext = createContext<RecallFlowContextType | undefined>(undefined);

function getInitialRoute(): AppRoute {
  const path = window.location.pathname;
  if (
    path === '/capture' ||
    path === '/ask' ||
    path === '/actions' ||
    path === '/memories' ||
    path === '/settings'
  ) {
    return path;
  }
  return '/';
}

export const RecallFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);
  const [workspaceContext, setWorkspaceContext] = useState<
    'Engineering Workspace' | 'Personal Vault (Private)'
  >('Engineering Workspace');

  const [memories, setMemories] = useState<MemoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return SEED_MEMORIES;
  });

  const [transientAuditLog, setTransientAuditLog] = useState<MemoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSIENT);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return SEED_TRANSIENT_AUDIT_LOG;
  });

  const [actionItems, setActionItems] = useState<ActionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return SEED_ACTION_ITEMS;
  });

  const [settings, setSettings] = useState<PrivacyAndMemorySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PRIVACY_SETTINGS;
  });

  const [recentAgentTraces, setRecentAgentTraces] = useState<AgentTrace[]>(
    SEED_RECENT_AGENT_TRACES
  );

  // Ingestion state
  const [isIngesting, setIsIngesting] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1);
  const [liveAgentTraces, setLiveAgentTraces] = useState<AgentTrace[]>(SEED_RECENT_AGENT_TRACES);
  const [lastIngestionResult, setLastIngestionResult] = useState<IngestionResult | null>(null);

  // Query state
  const [activeQueryText, setActiveQueryText] = useState<string>(
    'What did we decide about Qdrant costs?'
  );
  const [queryFilters, setQueryFilters] = useState<QueryFilters>({
    dateRange: 'all',
    sessionId: 'all',
    tag: 'all',
    privacyScope: 'Workspace',
    unresolvedOnly: false,
    workspaceContext: 'Engineering Workspace',
  });
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);

  // Modals
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [inspectedMemoryId, setInspectedMemoryId] = useState<string | null>(null);

  // Sync localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch {
      // ignore
    }
  }, [memories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSIENT, JSON.stringify(transientAuditLog));
    } catch {
      // ignore
    }
  }, [transientAuditLog]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIONS, JSON.stringify(actionItems));
    } catch {
      // ignore
    }
  }, [actionItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Keep queryFilters workspaceContext synced when workspace selector changes
  useEffect(() => {
    setQueryFilters((prev) => ({
      ...prev,
      workspaceContext,
      privacyScope:
        workspaceContext === 'Engineering Workspace' ? 'Workspace' : 'All Permitted',
    }));
  }, [workspaceContext]);

  // Handle popstate
  useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((route: AppRoute) => {
    setCurrentRoute(route);
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const updateSettings = useCallback((partial: Partial<PrivacyAndMemorySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  // Run initial default query so Ask Memory page is immediately rich and ready
  useEffect(() => {
    RecallFlowApiService.postQuery(
      'What did we decide about Qdrant costs?',
      {
        dateRange: 'all',
        sessionId: 'all',
        tag: 'all',
        privacyScope: 'Workspace',
        unresolvedOnly: false,
        workspaceContext: 'Engineering Workspace',
      },
      memories,
      actionItems
    ).then((res) => {
      setQueryResult(res);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerIngestion = useCallback(
    async (params: {
      transcript: string;
      sessionName?: string;
      sessionId?: string;
      privacyScope: PrivacyScope;
      retentionPolicy: RetentionPolicy;
      navigateToCapture?: boolean;
    }) => {
      if (params.navigateToCapture) {
        navigate('/capture');
      }

      const effectiveScope: PrivacyScope = !settings.enableTranscriptRetention
        ? 'Do Not Retain'
        : params.privacyScope;
      const effectiveRetention: RetentionPolicy =
        effectiveScope === 'Do Not Retain' ? 'None' : params.retentionPolicy;

      setIsIngesting(true);
      setActiveStageIndex(0);

      // Initialize queued agent traces for real-time visual orchestration
      const agentNames: AgentTrace['agentName'][] = [
        'Router Agent',
        'Privacy Policy Agent',
        'Memory Retrieval Agent',
        'Action Extraction Agent',
        'Context Reasoning Agent',
        'Briefing Agent',
      ];

      setLiveAgentTraces(
        agentNames.map((name, idx) => ({
          agentName: name,
          status: idx === 0 ? 'running' : 'queued',
          inputSummary: 'Awaiting upstream agent handoff...',
          outputSummary: 'Pending execution...',
          durationMs: 0,
          timestamp: new Date().toISOString(),
        }))
      );

      // Call the shared API/engine
      const { result, updatedMemories, updatedActionItems } =
        await RecallFlowApiService.postDemoIngest(
          {
            transcript: params.transcript,
            sessionName: params.sessionName,
            sessionId: params.sessionId,
            privacyScope: effectiveScope,
            retentionPolicy: effectiveRetention,
          },
          memories,
          actionItems
        );

      // Animate through the 7 stages & 6 agents smoothly
      const totalStages = 7;
      for (let step = 1; step < totalStages; step++) {
        await new Promise((r) => setTimeout(r, 240));
        setActiveStageIndex(step);

        setLiveAgentTraces(
          result.agentTrace.map((trace, idx) => {
            if (idx < step) return trace;
            if (idx === step) {
              return {
                ...trace,
                status: 'running',
                outputSummary: 'Orchestrating Lyzr agent step...',
              };
            }
            return {
              ...trace,
              status: 'queued',
              outputSummary: 'Queued in Lyzr pipeline...',
            };
          })
        );
      }

      await new Promise((r) => setTimeout(r, 180));
      setLiveAgentTraces(result.agentTrace);
      setRecentAgentTraces(result.agentTrace);
      setLastIngestionResult(result);

      if (effectiveScope === 'Do Not Retain' && result.transientRecord) {
        // Never add Do Not Retain to persistent memories! Only record in transient audit log.
        setTransientAuditLog((prev) => [result.transientRecord!, ...prev]);
      } else {
        setMemories(updatedMemories);
        setActionItems(updatedActionItems);
      }

      setIsIngesting(false);
    },
    [actionItems, memories, navigate, settings.enableTranscriptRetention]
  );

  const simulateQuickOmiEvent = useCallback(async () => {
    await triggerIngestion({
      transcript: PRIMARY_USER_STORY_TRANSCRIPT,
      sessionName: 'API Review — October 5',
      sessionId: 'sess_api_review_oct05',
      privacyScope:
        settings.defaultPrivacy === 'Private' ? 'Private' : 'Workspace',
      retentionPolicy: settings.defaultRetention,
      navigateToCapture: true,
    });
  }, [settings.defaultPrivacy, settings.defaultRetention, triggerIngestion]);

  const runQuery = useCallback(
    async (questionOverride?: string, navigateToAsk?: boolean) => {
      const q = (questionOverride ?? activeQueryText).trim();
      if (!q) return;

      if (questionOverride !== undefined) {
        setActiveQueryText(questionOverride);
      }
      if (navigateToAsk) {
        navigate('/ask');
      }

      setIsQuerying(true);
      await new Promise((r) => setTimeout(r, 220));

      const response = await RecallFlowApiService.postQuery(
        q,
        { ...queryFilters, workspaceContext },
        memories,
        actionItems
      );

      setQueryResult(response);
      setRecentAgentTraces(response.agentTrace);
      setIsQuerying(false);
    },
    [activeQueryText, actionItems, memories, navigate, queryFilters, workspaceContext]
  );

  const updateActionStatus = useCallback(
    async (actionItemId: string, status: ActionStatus) => {
      await RecallFlowApiService.patchActionItemStatus(actionItemId, status);
      setActionItems((prev) =>
        prev.map((item) =>
          item.actionItemId === actionItemId ? { ...item, status } : item
        )
      );
    },
    []
  );

  const deleteMemoryRecord = useCallback(
    async (memoryId: string) => {
      await RecallFlowApiService.deleteMemory(memoryId);
      const nextMemories = memories.filter((m) => m.memoryId !== memoryId);
      setMemories(nextMemories);
      if (inspectedMemoryId === memoryId) {
        setInspectedMemoryId(null);
      }
      // Refresh active query result so deleted memory is immediately removed from query results
      if (queryResult) {
        const refreshed = await RecallFlowApiService.postQuery(
          queryResult.query,
          { ...queryFilters, workspaceContext },
          nextMemories,
          actionItems
        );
        setQueryResult(refreshed);
      }
    },
    [actionItems, inspectedMemoryId, memories, queryFilters, queryResult, workspaceContext]
  );

  const resetDemoData = useCallback(async () => {
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
    } catch {
      // ignore
    }
    setMemories(SEED_MEMORIES);
    setTransientAuditLog(SEED_TRANSIENT_AUDIT_LOG);
    setActionItems(SEED_ACTION_ITEMS);
    setSettings(DEFAULT_PRIVACY_SETTINGS);
    setRecentAgentTraces(SEED_RECENT_AGENT_TRACES);
    setLastIngestionResult(null);
    setActiveStageIndex(-1);
    localStorage.removeItem(STORAGE_KEYS.MEMORIES);
    localStorage.removeItem(STORAGE_KEYS.ACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.TRANSIENT);

    const refreshed = await RecallFlowApiService.postQuery(
      'What did we decide about Qdrant costs?',
      {
        dateRange: 'all',
        sessionId: 'all',
        tag: 'all',
        privacyScope: 'Workspace',
        unresolvedOnly: false,
        workspaceContext: 'Engineering Workspace',
      },
      SEED_MEMORIES,
      SEED_ACTION_ITEMS
    );
    setQueryResult(refreshed);
  }, []);

  // Compute live dashboard metrics
  const memoriesStored = memories.filter(
    (m) => m.storageState === 'Stored in Qdrant' && m.privacyScope !== 'Do Not Retain'
  ).length;

  const openActionItems = actionItems.filter((a) => a.status !== 'Completed').length;

  const itemsDueSoon = actionItems.filter(
    (a) =>
      a.status !== 'Completed' &&
      (getActionUrgency(a.dueDate, a.status) === 'Due soon' ||
        getActionUrgency(a.dueDate, a.status) === 'Overdue')
  ).length;

  // Count distinct sessions in Oct 1 - Oct 5 week among primary sessions (seeded to 3 voice sessions this week)
  const primaryWeekSessions = new Set(
    memories
      .filter((m) =>
        [
          'sess_api_review_oct01',
          'sess_api_review_oct05',
          'sess_personal_oct05',
        ].includes(m.sessionId) || m.sessionId.startsWith('sess_omi_') || m.sessionId.includes('live')
      )
      .map((m) => m.sessionId)
  );
  const voiceSessionsThisWeek = Math.max(1, primaryWeekSessions.size);

  const inspectedMemory =
    memories.find((m) => m.memoryId === inspectedMemoryId) ||
    transientAuditLog.find((m) => m.memoryId === inspectedMemoryId) ||
    null;

  return (
    <RecallFlowContext.Provider
      value={{
        currentRoute,
        navigate,
        workspaceContext,
        setWorkspaceContext,
        memories,
        transientAuditLog,
        actionItems,
        recentAgentTraces,
        settings,
        updateSettings,
        integrationConfig: DEFAULT_INTEGRATION_CONFIG,
        metrics: {
          memoriesStored,
          openActionItems,
          itemsDueSoon,
          voiceSessionsThisWeek,
        },
        isIngesting,
        activeStageIndex,
        liveAgentTraces,
        lastIngestionResult,
        triggerIngestion,
        simulateQuickOmiEvent,
        activeQueryText,
        setActiveQueryText,
        queryFilters,
        setQueryFilters,
        isQuerying,
        queryResult,
        runQuery,
        updateActionStatus,
        deleteMemoryRecord,
        resetDemoData,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        inspectedMemory,
        setInspectedMemoryId,
      }}
    >
      {children}
    </RecallFlowContext.Provider>
  );
};

export function useRecallFlow() {
  const ctx = useContext(RecallFlowContext);
  if (!ctx) {
    throw new Error('useRecallFlow must be used within a RecallFlowProvider');
  }
  return ctx;
}
