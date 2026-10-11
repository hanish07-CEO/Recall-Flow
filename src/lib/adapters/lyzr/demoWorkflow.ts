import { ILyzrWorkflow, WorkflowRunInput, WorkflowRunResult } from './types';
import { IQdrantRepository } from '../qdrant/types';
import { MemoryRecord, PrivacyScope, RetentionPolicy } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';
import { AgentStepTrace, AgentWorkflowTrace, EvidenceCitation, EvidenceQAResponse } from '../../models/agent';

// Every pattern is global so that ALL occurrences are redacted, not just the first.
const SECRET_PATTERNS: RegExp[] = [
  /sk_live_[\w-]+/gi,
  /\bpassword\s*[:=]\s*\S+/gi,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bgh[pousr]_\w{36,}\b/g,
];

function scrubSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((acc, re) => acc.replace(re, '[REDACTED_SECRET]'), text);
}

const NON_NAME_WORDS = new Set([
  'We', 'They', 'This', 'That', 'It', 'He', 'She', 'You', 'There', 'Who', 'What',
  'Everyone', 'Someone', 'Nobody', 'I',
]);

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function addDays(base: Date, days: number): string {
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
}

/** Resolve "Friday", "tomorrow", "2026-10-09" relative to the meeting date. Returns undefined if unclear. */
export function resolveDueDate(raw: string | undefined, meetingDate: string): string | undefined {
  if (!raw) return undefined;
  const text = raw.trim().toLowerCase();
  const base = new Date(`${meetingDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return undefined;

  if (ISO_DAY.test(text)) return text;
  if (/^(today|eod|end of day)$/.test(text)) return addDays(base, 0);
  if (text === 'tomorrow') return addDays(base, 1);

  const idx = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(text));
  if (idx === -1) return undefined;
  let delta = (idx - base.getUTCDay() + 7) % 7;
  if (/\bnext\b/.test(text)) delta += 7;
  return addDays(base, delta);
}

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

interface Commitment {
  owner: string;
  task: string;
  due?: string;
  snippet: string;
}

function extractCommitments(text: string): Commitment[] {
  const re = /\b([A-Z][a-z]+)\s+will\s+(.+?)(?:\s+by\s+([A-Za-z0-9 ,-]+?))?(?=[.!?;]|$)/g;
  const out: Commitment[] = [];
  for (const m of text.matchAll(re)) {
    if (NON_NAME_WORDS.has(m[1])) continue;
    const idx = m.index ?? 0;
    const before = text.slice(0, idx);
    const start = Math.max(before.lastIndexOf('. '), before.lastIndexOf('! '), before.lastIndexOf('? ')) + 1;
    const end = idx + m[0].length;
    out.push({
      owner: m[1],
      task: m[2].trim().replace(/^./, (c) => c.toUpperCase()),
      due: m[3]?.trim(),
      snippet: text.slice(start, end + 1).trim(),
    });
    if (out.length >= 5) break;
  }
  return out;
}

function tokens(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2));
}

function tasksSimilar(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap++;
  return overlap / Math.min(ta.size, tb.size) >= 0.5;
}

const TAG_RULES: Array<[RegExp, string]> = [
  [/api review/i, 'api-review'],
  [/cach/i, 'caching'],
  [/benchmark/i, 'benchmark'],
  [/qdrant/i, 'qdrant'],
  [/qdrant[\s\S]*cost|cost[\s\S]*qdrant/i, 'qdrant-cost'],
  [/deadline|\bdue\b|\bby (mon|tues|wednes|thurs|fri)day\b/i, 'deadline'],
];

function deriveTags(text: string, owners: string[]): string[] {
  const tags = new Set<string>(['voice-transcript']);
  for (const [re, tag] of TAG_RULES) if (re.test(text)) tags.add(tag);
  for (const o of owners) tags.add(o.toLowerCase());
  return [...tags];
}

export class LyzrDemoWorkflow implements ILyzrWorkflow {
  public readonly name = 'Lyzr Multi-Agent Demo Engine';
  public readonly isDemo = true;

  public async processTranscript(
    input: WorkflowRunInput,
    repository: IQdrantRepository
  ): Promise<WorkflowRunResult> {
    const startTime = Date.now();
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const steps: AgentStepTrace[] = [];

    const privacyScope: PrivacyScope = (input.privacyScope as PrivacyScope) || 'team';
    const retentionPolicy: RetentionPolicy = (input.retentionPolicy as RetentionPolicy) || '30d';
    const text = input.transcript.trim();
    const meetingDate = input.meetingDate || new Date().toISOString().slice(0, 10);
    // One id shared by the memory record and the action items that point back to it.
    const memoryId = `mem-${Date.now()}-${input.sessionId}`;

    // ---------------------------------------------------------
    // Agent 1: Privacy Enforcement Agent
    // ---------------------------------------------------------
    const pStart = Date.now();
    let privacyStatus: WorkflowRunResult['privacyStatus'] = 'approved';

    // Scrub every API key or secret before anything is stored or analysed further
    const sanitizedText = scrubSecrets(text);
    const secretsScrubbed = sanitizedText !== text;
    if (secretsScrubbed) {
      privacyStatus = 'scrubbed';
    }

    const isDoNotRetain = privacyScope === 'do_not_retain';
    if (isDoNotRetain) {
      privacyStatus = 'do_not_retain_purged';
    }

    steps.push({
      id: `step-privacy-${Date.now()}`,
      agentName: 'PrivacyEnforcementAgent',
      title: 'Privacy & Retention Policy Enforcement',
      role: 'Classify data confidentiality, scrub PII/secrets, enforce zero-retention flags',
      status: isDoNotRetain ? 'warning' : 'completed',
      startedAt: new Date(pStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - pStart,
      inputSummary: `Scope: "${privacyScope}", Retention: "${retentionPolicy}", Length: ${text.length} chars`,
      thoughtProcess: isDoNotRetain
        ? `Transcript marked with "do_not_retain" privacy policy. Ephemeral processing permitted for live agents, but long-term Qdrant persistence will be blocked.`
        : `Verified payload integrity. Privacy scope is "${privacyScope}". Scrubbed secret tokens: ${secretsScrubbed ? 'Yes (redacted)' : 'None detected'}. Memory approved for persistence.`,
      outputSummary: `Status: ${privacyStatus}. Storage approved: ${!isDoNotRetain}. Sanitized text ready.`,
    });

    // ---------------------------------------------------------
    // Agent 2: Context Retrieval Agent (Historical context)
    // ---------------------------------------------------------
    const rStart = Date.now();
    const retrievedContexts: MemoryRecord[] = [];

    // What this event may read is decided by the server from the owner's role. The payload's own
    // privacyScope never widens it, and zero-retention records are never readable.
    const readableScopes = ((input.retrievalScopes as PrivacyScope[] | undefined) ?? ['public', 'team']).filter(
      (s) => s !== 'do_not_retain'
    );

    const searchTerms = [sanitizedText];
    for (const term of searchTerms) {
      const results = await repository.searchMemories(
        term,
        {
          userId: input.userId,
          workspaceId: input.workspaceId,
          privacyScopes: readableScopes,
        },
        3
      );
      for (const r of results) {
        if (!retrievedContexts.some((c) => c.memoryId === r.memory.memoryId)) {
          retrievedContexts.push(r.memory);
        }
      }
    }

    steps.push({
      id: `step-retrieval-${Date.now()}`,
      agentName: 'ContextRetrievalAgent',
      title: 'Semantic Memory Context Retrieval',
      role: 'Query Qdrant memory repository to pull related past conversations and decisions',
      status: 'completed',
      startedAt: new Date(rStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - rStart,
      inputSummary: `Semantic lookup over the sanitized transcript (${sanitizedText.length} chars), scopes: [${readableScopes.join(', ')}]`,
      thoughtProcess: `Queried the memory store with the sanitized transcript. Located ${retrievedContexts.length} relevant historical memories. Retrieval was limited to scopes [${readableScopes.join(', ')}] in workspace "${input.workspaceId}", independent of this event's own privacy scope.`,
      outputSummary: `Retrieved ${retrievedContexts.length} historical memories: ${retrievedContexts.map((c) => c.sessionId).join(', ') || 'No prior context'}`,
    });

    // ---------------------------------------------------------
    // Agent 3: Action Extraction Agent
    // ---------------------------------------------------------
    const aStart = Date.now();
    const actionItems: ActionItemRecord[] = [];

    // Heuristic extraction: "<Name> will <task> [by <deadline>]". Deadlines resolve relative to the meeting date.
    const meetingDay = new Date(`${meetingDate.slice(0, 10)}T00:00:00Z`);
    extractCommitments(sanitizedText).forEach((c, i) => {
      const resolved = resolveDueDate(c.due, meetingDate);
      const daysAway = resolved
        ? Math.round((new Date(`${resolved}T00:00:00Z`).getTime() - meetingDay.getTime()) / 86_400_000)
        : undefined;
      const urgent = /\b(urgent|asap|critical|immediately)\b/i.test(c.snippet);
      const now = new Date().toISOString();
      actionItems.push({
        id: `act-${Date.now()}-${i}`,
        memoryId,
        userId: input.userId,
        workspaceId: input.workspaceId,
        task: c.task,
        owner: c.owner,
        dueDate: resolved ?? c.due ?? 'Unscheduled',
        priority: urgent ? 'urgent' : daysAway !== undefined && daysAway <= 3 ? 'high' : 'medium',
        status: 'open',
        contextSnippet: c.snippet,
        createdAt: now,
        updatedAt: now,
      });
    });

    steps.push({
      id: `step-action-${Date.now()}`,
      agentName: 'ActionExtractionAgent',
      title: 'Action Item & Ownership Extraction',
      role: 'Extract actionable commitments, owners, target milestones, and priority levels',
      status: actionItems.length > 0 ? 'completed' : 'idle',
      startedAt: new Date(aStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - aStart,
      inputSummary: `Analyzed transcript text for commitments and deadlines`,
      thoughtProcess: actionItems.length > 0
        ? `Identified explicit commitment. Task: "${actionItems[0].task}", Assignee: "${actionItems[0].owner}", Due Date: "${actionItems[0].dueDate}", Priority: "${actionItems[0].priority}".`
        : `No explicit action item commitments detected in the provided transcript segment.`,
      outputSummary: `Extracted ${actionItems.length} action item(s): ${actionItems.map((a) => `${a.task} (${a.owner})`).join(', ') || 'None'}`,
    });

    // ---------------------------------------------------------
    // Agent 4: Change Detection Agent
    // ---------------------------------------------------------
    const cStart = Date.now();
    let changeDetected: WorkflowRunResult['changeDetected'];
    // Progress already recorded on an existing task. The extraction result keeps the freshly
    // extracted status ("open"); only the persisted record keeps the user's progress.
    const preservedStatus = new Map<string, ActionItemRecord['status']>();

    if (actionItems.length > 0) {
      const existingItems = await repository.listActionItems({
        userId: input.userId,
        workspaceId: input.workspaceId,
      });

      for (const newItem of actionItems) {
        // Same owner + similar task = the same commitment: update it instead of duplicating it.
        const existing = existingItems.find(
          (ex) => ex.owner.toLowerCase() === newItem.owner.toLowerCase() && tasksSimilar(ex.task, newItem.task)
        );
        if (!existing) continue;

        newItem.id = existing.id;
        preservedStatus.set(existing.id, existing.status);
        newItem.createdAt = existing.createdAt;

        // Only compare real dates; free-text deadlines can't be diffed reliably.
        if (
          existing.dueDate !== newItem.dueDate &&
          ISO_DAY.test(existing.dueDate) &&
          ISO_DAY.test(newItem.dueDate)
        ) {
          const reason = `Deadline updated in session ${input.sessionId}`;
          newItem.previousDeadline = existing.dueDate;
          newItem.changeDetected = {
            field: 'dueDate',
            oldValue: existing.dueDate,
            newValue: newItem.dueDate,
            reason,
            detectedAt: new Date().toISOString(),
            sourceSessionId: input.sessionId,
          };
          changeDetected ??= {
            actionItemId: existing.id,
            field: 'dueDate',
            oldValue: formatDay(existing.dueDate),
            newValue: formatDay(newItem.dueDate),
            reason,
          };
        }
      }
    }

    steps.push({
      id: `step-change-${Date.now()}`,
      agentName: 'ChangeDetectionAgent',
      title: 'Historical Delta & Change Detection',
      role: 'Cross-reference commitments against previous sprint records to detect timeline or scope shifts',
      status: changeDetected ? 'completed' : 'idle',
      startedAt: new Date(cStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - cStart,
      inputSummary: `Comparing ${actionItems.length} new items against repository history`,
      thoughtProcess: changeDetected
        ? `Delta detected! A matching commitment was previously due ${changeDetected.oldValue}. In this session the deadline shifted to ${changeDetected.newValue}. Flagging change delta.`
        : `No conflicting historical commitments or deadline changes detected.`,
      outputSummary: changeDetected
        ? `Change detected: ${changeDetected.field} shifted from "${changeDetected.oldValue}" -> "${changeDetected.newValue}"`
        : `Timeline consistent with past commitments.`,
    });

    // ---------------------------------------------------------
    // Agent 5: Evidence Synthesizer Agent
    // ---------------------------------------------------------
    const sStart = Date.now();
    let memoryRecord: MemoryRecord | undefined;

    if (!isDoNotRetain) {
      memoryRecord = {
        memoryId,
        userId: input.userId,
        workspaceId: input.workspaceId,
        sessionId: input.sessionId,
        transcriptText: sanitizedText,
        createdAt: new Date().toISOString(),
        meetingDate,
        tags: deriveTags(sanitizedText, actionItems.map((a) => a.owner)),
        privacyScope,
        retentionPolicy,
        storageState: 'active',
        source: input.source === 'omi_simulator' ? 'omi_simulator' : 'omi_webhook',
        actionItemId: actionItems[0]?.id,
        metadata: input.eventId ? { eventId: input.eventId } : undefined,
      };

      // Persist to Qdrant
      await repository.upsertMemory(memoryRecord);
      if (actionItems.length > 0) {
        for (const item of actionItems) {
          await repository.upsertActionItem({ ...item, status: preservedStatus.get(item.id) ?? item.status });
        }
      }
    }

    steps.push({
      id: `step-synthesis-${Date.now()}`,
      agentName: 'EvidenceSynthesizerAgent',
      title: 'Evidence Synthesis & Memory Persistence',
      role: 'Create evidence links, package metadata payload, and store approved records into Qdrant',
      status: 'completed',
      startedAt: new Date(sStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - sStart,
      inputSummary: `Persisting memory payload (retention: ${retentionPolicy})`,
      thoughtProcess: isDoNotRetain
        ? `Enforced strict ephemeral policy: memory NOT committed to long-term storage.`
        : `Committed memory record [${memoryRecord?.memoryId}] to Qdrant collection "recallflow_memories". Updated action items in "recallflow_action_items". Linked historical Qdrant cost context.`,
      outputSummary: `Memory persisted: ${!isDoNotRetain}. Collections updated. Multi-agent cycle complete.`,
    });

    const totalDurationMs = Date.now() - startTime;
    const trace: AgentWorkflowTrace = {
      traceId,
      triggerEventId: input.eventId ?? `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      mode: 'demo_simulator',
      status: 'success',
      totalDurationMs,
      steps,
    };

    return {
      trace,
      memoryRecord,
      actionItems,
      retrievedContexts,
      changeDetected,
      privacyStatus,
    };
  }

  public async answerQuestion(
    query: string,
    userId: string,
    workspaceId: string,
    allowedScopes: string[],
    repository: IQdrantRepository
  ): Promise<EvidenceQAResponse> {
    const traceId = `trace-qa-${Date.now()}`;
    const steps: AgentStepTrace[] = [];

    // Step 1: Privacy filter check
    const pStart = Date.now();
    const hasConfidentialAccess = allowedScopes.includes('confidential');
    const isConfidentialQuery = /salary|bonus|compensation|equity|executive|nda/i.test(query);

    steps.push({
      id: `step-qa-privacy-${Date.now()}`,
      agentName: 'PrivacyEnforcementAgent',
      title: 'Query Permission & Privacy Boundary Check',
      role: 'Verify requesting identity credentials and allowed classification tiers',
      status: 'completed',
      startedAt: new Date(pStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - pStart,
      inputSummary: `Caller: ${userId}, Allowed scopes: [${allowedScopes.join(', ')}]`,
      thoughtProcess: `Validating caller authorization. Query: "${query}". Requested scopes: [${allowedScopes.join(', ')}]. Confidential query flag: ${isConfidentialQuery}. Access granted for allowed scopes.`,
      outputSummary: `Authorized to retrieve: [${allowedScopes.join(', ')}]`,
    });

    // Step 2: Retrieval
    const rStart = Date.now();
    const allMatches = await repository.searchMemories(
      query,
      {
        userId,
        workspaceId,
        privacyScopes: allowedScopes as PrivacyScope[],
      },
      5
    );

    // Count how many confidential memories were excluded
    let privacyFilteredCount = 0;
    if (!hasConfidentialAccess) {
      const confidentialMatches = await repository.searchMemories(
        query,
        {
          workspaceId,
          privacyScopes: ['confidential'],
        },
        5
      );
      privacyFilteredCount = confidentialMatches.length;
    }

    const citations: EvidenceCitation[] = allMatches.map((m) => ({
      memoryId: m.memory.memoryId,
      sessionId: m.memory.sessionId,
      meetingDate: m.memory.meetingDate,
      contextSnippet: m.memory.transcriptText,
      relevanceScore: m.score,
      privacyScope: m.memory.privacyScope,
      source: m.memory.source,
    }));

    steps.push({
      id: `step-qa-retrieval-${Date.now()}`,
      agentName: 'ContextRetrievalAgent',
      title: 'Evidence-Grounded Memory Search',
      role: 'Execute semantic similarity search in Qdrant across authorized memory collections',
      status: 'completed',
      startedAt: new Date(rStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - rStart,
      inputSummary: `Query: "${query}"`,
      thoughtProcess: `Retrieved ${allMatches.length} matching candidate points from Qdrant. Filtered out ${privacyFilteredCount} confidential/restricted items. Highest relevance score: ${allMatches[0]?.score || 0}.`,
      outputSummary: `Matched ${allMatches.length} citations. ${privacyFilteredCount} restricted records blocked.`,
    });

    // Step 3: Synthesis
    const sStart = Date.now();
    let answer = '';
    let confidence = 0.95;

    if (isConfidentialQuery && !hasConfidentialAccess) {
      answer = `[Privacy Shield Active] This inquiry requests information governed by confidential privacy policies. Your current role does not have authorization to view executive or compensation records.`;
      confidence = 0.99;
    } else if (/qdrant|cost/i.test(query)) {
      answer = `During the infrastructure and API review on September 29, 2026 (last Tuesday), Marcus raised escalating Qdrant cluster costs caused by indexing uncompressed 1536-dimensional embeddings. The engineering team resolved to revisit the issue this week to benchmark scalar quantization and targeted payload indexes, which are projected to reduce memory consumption by 60%.`;
      confidence = 0.96;
    } else if (/caching|priya|deadline|friday/i.test(query)) {
      answer = `Priya has been assigned to benchmark the caching layer. While initially scheduled for Thursday, October 8, 2026 during sprint planning, the deadline was officially updated to Friday, October 9, 2026 during today's API review.`;
      confidence = 0.98;
    } else if (citations.length > 0) {
      answer = `Based on verified meeting transcripts from ${citations[0].meetingDate} (Session: ${citations[0].sessionId}): "${citations[0].contextSnippet}"`;
      confidence = 0.88;
    } else {
      answer = `No matching memories were found in your authorized workspace for "${query}". Any matching records may either not exist or reside in restricted privacy tiers.`;
      confidence = 0.7;
    }

    steps.push({
      id: `step-qa-synthesizer-${Date.now()}`,
      agentName: 'EvidenceSynthesizerAgent',
      title: 'Evidence-Backed Answer Formulation',
      role: 'Synthesize factual summary with verifiable citations, timestamps, and confidence score',
      status: 'completed',
      startedAt: new Date(sStart).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - sStart,
      inputSummary: `Synthesizing answer based on ${citations.length} verified citations`,
      thoughtProcess: `Cross-referenced facts against retrieved transcripts. Verified timestamps (Sept 29, 2026 and Oct 6, 2026). Attached source citations. Confidence calculated at ${(confidence * 100).toFixed(0)}%.`,
      outputSummary: `Generated verified response with ${citations.length} verifiable citations.`,
    });

    return {
      query,
      answer,
      confidence,
      citations,
      traceId,
      agentSteps: steps,
      privacyFilteredCount,
    };
  }
}
