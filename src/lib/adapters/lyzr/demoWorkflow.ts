import { ILyzrWorkflow, WorkflowRunInput, WorkflowRunResult } from './types';
import { IQdrantRepository } from '../qdrant/types';
import { MemoryRecord, PrivacyScope, RetentionPolicy } from '../../models/memory';
import { ActionItemRecord } from '../../models/actionItem';
import { AgentStepTrace, AgentWorkflowTrace, EvidenceCitation, EvidenceQAResponse } from '../../models/agent';

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

    // ---------------------------------------------------------
    // Agent 1: Privacy Enforcement Agent
    // ---------------------------------------------------------
    const pStart = Date.now();
    let sanitizedText = text;
    let privacyStatus: WorkflowRunResult['privacyStatus'] = 'approved';

    // Scrub API keys or secrets
    const keyMatch = text.match(/(sk_live_[a-zA-Z0-9_-]+|password\s*[:=]\s*\S+)/i);
    if (keyMatch) {
      sanitizedText = text.replace(keyMatch[0], '[REDACTED_SECRET]');
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
        : `Verified payload integrity. Privacy scope is "${privacyScope}". Scrubbed secret tokens: ${keyMatch ? 'Yes (redacted)' : 'None detected'}. Memory approved for persistence.`,
      outputSummary: `Status: ${privacyStatus}. Storage approved: ${!isDoNotRetain}. Sanitized text ready.`,
    });

    // ---------------------------------------------------------
    // Agent 2: Context Retrieval Agent (Historical context)
    // ---------------------------------------------------------
    const rStart = Date.now();
    const retrievedContexts: MemoryRecord[] = [];

    // Check if transcript references historical topics (e.g. Qdrant cost issue, last Tuesday, caching)
    const searchTerms = [];
    if (/qdrant|cost|tuesday/i.test(sanitizedText)) searchTerms.push('qdrant cost issue last tuesday');
    if (/caching|benchmark/i.test(sanitizedText)) searchTerms.push('caching benchmark sprint');

    for (const term of searchTerms) {
      const results = await repository.searchMemories(
        term,
        {
          userId: input.userId,
          workspaceId: input.workspaceId,
          privacyScopes: [privacyScope, 'public', 'team'],
        },
        2
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
      inputSummary: `Queries: [${searchTerms.join(', ')}]`,
      thoughtProcess: `Extracted semantic lookup keys from transcript: [${searchTerms.join(', ')}]. Located ${retrievedContexts.length} relevant historical memories in Qdrant collections. Verified caller permissions for workspace "${input.workspaceId}".`,
      outputSummary: `Retrieved ${retrievedContexts.length} historical memories: ${retrievedContexts.map((c) => c.sessionId).join(', ') || 'No prior context'}`,
    });

    // ---------------------------------------------------------
    // Agent 3: Action Extraction Agent
    // ---------------------------------------------------------
    const aStart = Date.now();
    const actionItems: ActionItemRecord[] = [];

    // Analyze target scenario: "During today’s API review, Priya will benchmark caching by Friday..."
    const isPriyaCaching = /priya/i.test(sanitizedText) && /benchmark/i.test(sanitizedText) && /caching/i.test(sanitizedText);

    if (isPriyaCaching) {
      actionItems.push({
        id: `act-${Date.now()}-priya-caching`,
        memoryId: `mem-${input.sessionId}`,
        userId: input.userId,
        workspaceId: input.workspaceId,
        task: 'Benchmark caching',
        owner: 'Priya',
        dueDate: '2026-10-09', // Friday, October 9, 2026
        priority: 'high',
        status: 'open',
        contextSnippet: 'During today’s API review, Priya will benchmark caching by Friday.',
        previousDeadline: '2026-10-08',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // General heuristic extraction for arbitrary transcripts
      const matchAssignee = sanitizedText.match(/([A-Z][a-z]+)\s+will\s+([^.]+?)(?:\s+by\s+([A-Za-z0-9\s]+))?(?:\.|$)/i);
      if (matchAssignee) {
        actionItems.push({
          id: `act-${Date.now()}-generic`,
          memoryId: `mem-${input.sessionId}`,
          userId: input.userId,
          workspaceId: input.workspaceId,
          task: matchAssignee[2].trim(),
          owner: matchAssignee[1].trim(),
          dueDate: matchAssignee[3] ? matchAssignee[3].trim() : '2026-10-09',
          priority: 'medium',
          status: 'open',
          contextSnippet: matchAssignee[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

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
        ? `Identified explicit commitment. Task: "${actionItems[0].task}", Assignee: "${actionItems[0].owner}", Due Date: "${actionItems[0].dueDate}" (Friday), Priority: "${actionItems[0].priority}".`
        : `No explicit action item commitments detected in the provided transcript segment.`,
      outputSummary: `Extracted ${actionItems.length} action item(s): ${actionItems.map((a) => `${a.task} (${a.owner})`).join(', ') || 'None'}`,
    });

    // ---------------------------------------------------------
    // Agent 4: Change Detection Agent
    // ---------------------------------------------------------
    const cStart = Date.now();
    let changeDetected: WorkflowRunResult['changeDetected'];

    if (actionItems.length > 0) {
      const existingItems = await repository.listActionItems({
        userId: input.userId,
        workspaceId: input.workspaceId,
      });

      for (const newItem of actionItems) {
        const existing = existingItems.find(
          (ex) =>
            ex.owner.toLowerCase() === newItem.owner.toLowerCase() &&
            (ex.task.toLowerCase().includes('caching') || newItem.task.toLowerCase().includes(ex.task.toLowerCase()))
        );

        if (existing && existing.dueDate !== newItem.dueDate) {
          changeDetected = {
            actionItemId: existing.id,
            field: 'dueDate',
            oldValue: 'Thursday, October 8, 2026',
            newValue: 'Friday, October 9, 2026',
            reason: 'Extended by Priya during API review',
          };

          // Attach change details to the action item
          newItem.id = existing.id; // Update existing record
          newItem.previousDeadline = existing.dueDate;
          newItem.changeDetected = {
            field: 'dueDate',
            oldValue: existing.dueDate,
            newValue: newItem.dueDate,
            reason: 'Extended by Priya during API review',
            detectedAt: new Date().toISOString(),
            sourceSessionId: input.sessionId,
          };
          break;
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
        ? `Delta detected! Priya's caching benchmark was previously committed for ${changeDetected.oldValue}. In today's meeting, the deadline shifted to ${changeDetected.newValue}. Flagging change delta.`
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
        memoryId: `mem-${Date.now()}-${input.sessionId}`,
        userId: input.userId,
        workspaceId: input.workspaceId,
        sessionId: input.sessionId,
        transcriptText: sanitizedText,
        createdAt: new Date().toISOString(),
        meetingDate: input.meetingDate || '2026-10-06',
        tags: ['api-review', 'caching', 'priya', 'qdrant-cost', 'voice-transcript'],
        privacyScope,
        retentionPolicy,
        storageState: 'active',
        source: 'omi_simulator',
        actionItemId: actionItems[0]?.id,
      };

      // Persist to Qdrant
      await repository.upsertMemory(memoryRecord);
      if (actionItems.length > 0) {
        for (const item of actionItems) {
          await repository.upsertActionItem(item);
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
      triggerEventId: `evt-${Date.now()}`,
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
