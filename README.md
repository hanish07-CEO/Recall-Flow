# RecallFlow

> **“Turn spoken work into lasting context and accountable action.”**

RecallFlow is a privacy-aware, voice-first meeting and knowledge-memory copilot built for agentic-AI workflows. Users capture spoken notes and meeting updates through **Omi**, persist policy-approved semantic memories and tasks in **Qdrant**, and query historical context through a **Lyzr**-orchestrated six-agent workflow.

---

## 1. Product Overview

Engineers, founders, managers, researchers, and students frequently capture critical decisions, task updates, and project thoughts by voice. Traditional transcription tools produce static text walls without temporal awareness, task accountability, or strict workspace privacy boundaries.

**RecallFlow** solves this by treating every spoken update as a structured, policy-governed memory event:
- **Voice-First Ingestion**: Accepts live Omi webhook streams (`POST /api/omi/webhook`) or deterministic simulated voice events.
- **Policy-First Vector Memory**: Enforces `Workspace`, `Private`, and `Do Not Retain` scopes before embedding or writing to Qdrant.
- **Temporal Reasoning & Change Detection**: Automatically links new meeting updates against historical memories (e.g., detecting that a caching benchmark deadline shifted from Thursday to Friday across API reviews).
- **Evidence-Grounded Briefings**: Every answer explicitly distinguishes between `Confirmed from memory`, `Inferred from context`, and `No supporting memory found`, accompanied by timestamped quotes and Qdrant record IDs.

---

## 2. Core Features

- **Stateful Dashboard (`/`)**: Live telemetry for stored Qdrant memories, open action items, items due soon, and weekly voice sessions, paired with one-click demo queries and recent Lyzr agent traces.
- **Voice Capture & Staged Ingestion (`/capture`)**: Interactive Omi transcript ingestion studio featuring a 7-stage pipeline timeline (`Received → Privacy checked → Chunked → Embedded → Qdrant stored → Lyzr analyzed → Complete`), preset session loader, and Qdrant payload inspector.
- **Evidence-Backed Ask Memory (`/ask`)**: Multi-facet semantic query interface with confidence scoring, timestamped quote citations, historical deadline comparison cards, and 6-agent execution traces.
- **Accountable Action Items (`/actions`)**: Table and card views with urgency indicators (`Overdue`, `Due soon`, `Upcoming`), live status mutation, and linked change history (`Deadline updated: Thursday, Oct 1 → Friday, Oct 9`).
- **Semantic Memory Explorer (`/memories`)**: Cosine-similarity search across Qdrant vector records, scope/tag filtering, confirmation-protected deletion, and a dedicated non-persistent audit log proving `Do Not Retain` notes are never stored.
- **Privacy & Integration Governance (`/settings`)**: Default privacy/retention policies, transparency toggles, masked environment variable inspection, full system architecture visualization, and confirmation-protected demo reset.

---

## 3. Architecture Diagram

```text
Omi Voice Input
  → Transcript Ingestion API (POST /api/omi/webhook)
  → Privacy and Retention Check (Workspace | Private | Do Not Retain)
  → Chunking and Embedding (380-token windows, 1536-d vectors)
  → Qdrant Vector Memory (recallflow_memories & recallflow_action_items)
  → Lyzr Router Agent
  → Privacy Policy Agent
  → Memory Retrieval Agent
  → Action Extraction Agent
  → Context Reasoning Agent
  → Briefing Agent
  → Evidence-backed User Response
```

> Omi provides voice-originated transcript events. Qdrant stores approved long-term semantic memory and searchable action items. Lyzr coordinates specialized agents that retrieve context, enforce policy, extract tasks, compare historical information, and create evidence-grounded briefings.

---

## 4. How Omi Is Used

- **Webhook Ingestion (`POST /api/omi/webhook`)**: Receives structured `VoiceTranscriptEvent` payloads containing `eventId`, `sessionId`, `userId`, `workspaceId`, `timestamp`, `transcript`, `privacyScope`, and `retentionPolicy`.
- **Unified Simulator (`POST /api/demo/ingest`)**: The UI button **“Simulate Omi Voice Event”** dispatches Omi-compatible events through the exact same ingestion pipeline as hardware webhook calls, clearly labeled under **Demo Mode**.

---

## 5. How Qdrant Is Used

Qdrant acts as the long-term semantic vector store and structured payload filter across two collections:
1. **`recallflow_memories` (`QDRANT_COLLECTION_MEMORIES`)**:
   - Stores 1536-dimensional embeddings alongside keyword-indexed payload fields: `memoryId`, `userId`, `workspaceId`, `sessionId`, `timestamp`, `tags`, `privacyScope`, `retentionPolicy`, `source`, and `storageState`.
   - Executes server-side pre-filtering on `workspaceId` and `privacyScope` prior to HNSW similarity scoring.
2. **`recallflow_action_items` (`QDRANT_COLLECTION_ACTION_ITEMS`)**:
   - Stores extracted tasks (`actionItemId`, `task`, `owner`, `dueDate`, `priority`, `status`, `relatedMemoryIds`, `evidence`, `confidence`, `privacyScope`, and `changeHistory`).

---

## 6. How Lyzr Is Used

Lyzr orchestrates six specialized, collaborating agents on every ingestion and query run:
1. **Router Agent**: Classifies incoming voice transcripts or user questions and determines the downstream execution graph.
2. **Privacy Policy Agent**: Audits `privacyScope` and `retentionPolicy` (`Privacy checked`). Blocks vector storage for `Do Not Retain` notes and prevents `Private` memories from leaking into `Workspace` queries.
3. **Memory Retrieval Agent**: Queries `recallflow_memories` in Qdrant using pre-filtered vector search to surface prior context.
4. **Action Extraction Agent**: Identifies tasks, owners, priorities, and target due dates from spoken segments.
5. **Context Reasoning Agent**: Compares newly extracted facts against retrieved historical memories (e.g., detecting that Priya’s caching benchmark moved from Thursday, Oct 1 to Friday, Oct 9).
6. **Briefing Agent**: Compiles the final response, attaches cited memory IDs and quotes, and classifies the result (`Confirmed from memory`, `Inferred from context`, or `No supporting memory found`).

---

## 7. Privacy Model

- **Data-Layer Enforcement**: Privacy filtering is executed in the data/query service layer (`filterMemoriesByPrivacyPolicy`), never merely hidden in the UI.
- **Workspace Isolation**: Queries executed in `Engineering Workspace` return only `Workspace`-permitted records. `Memory 3` (`Private note: I need to review my personal spending before the weekend.`) is strictly excluded from workspace queries.
- **Zero Persistence for `Do Not Retain`**: Voice notes marked `Do Not Retain` (such as `Memory 4`) bypass chunking, embedding, and Qdrant storage (`Storage state: Not stored`) and return:
  *“Transient analysis complete. This content was not embedded or written to long-term memory.”*

---

## 8. Environment Variables (`.env.example`)

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
QDRANT_URL=https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=
QDRANT_COLLECTION_MEMORIES=recallflow_memories
QDRANT_COLLECTION_ACTION_ITEMS=recallflow_action_items
LYZR_API_KEY=
LYZR_AGENT_CONFIG_ID=lyzr_recallflow_multiagent_v1
OMI_WEBHOOK_SECRET=
DEMO_MODE=true
```

---

## 9. API Contract Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/omi/webhook` | Accepts Omi-compatible voice transcript payloads and runs the shared ingestion workflow. |
| `POST` | `/api/demo/ingest` | Runs the shared ingestion workflow with deterministic demo payloads. |
| `POST` | `/api/query` | Accepts `{ question, filters }` and returns `{ answer, classification, confidence, evidence, retrievedMemories, relatedActionItems, agentTrace, changeComparison }`. |
| `GET` | `/api/action-items` | Returns workspace-permitted action items from `recallflow_action_items`. |
| `PATCH` | `/api/action-items/:id` | Updates an action item's `status` (`Open`, `In progress`, `Completed`, `Blocked`). |
| `GET` | `/api/memories` | Returns server-side privacy-filtered memories from `recallflow_memories`. |
| `DELETE` | `/api/memories/:id` | Deletes a memory record by `memoryId`. |
| `GET` | `/api/health` | Returns service health and active integration mode. |

---

## 10. Setup Instructions & Demo Mode

```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env

# 3. Start full-stack development server on port 3000
npm run dev
```

When `DEMO_MODE=true` (default), RecallFlow operates deterministically without requiring external hardware or private API keys, while keeping all REST endpoints and data contracts active.

---

## 11. Five-Minute Hackathon Demo Script

1. **Dashboard Overview (0:00 – 0:45)**:
   - Highlight the `Engineering Workspace` context, `Demo Mode` indicator, and live metrics (`12 Memories stored`, `4 Open action items`, `2 Items due soon`, `3 Voice sessions this week`).
2. **Simulated Omi Voice Ingestion (0:45 – 2:00)**:
   - Click **“Simulate Omi Voice Event”** (or navigate to `/capture`).
   - Process the transcript: *“During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.”*
   - Watch the 7-stage pipeline and 6-agent Lyzr trace execute in real time, extracting Priya’s Friday task, retrieving `Memory 1` (`Oct 1`), and detecting the `Thursday → Friday` deadline shift.
   - Switch the preset to **Seeded Memory 4 (Do Not Retain)** and click **“Process voice event”** to demonstrate transient analysis without Qdrant storage.
3. **Evidence-Grounded Querying (2:00 – 3:30)**:
   - Open **Ask Memory (`/ask`)** and click the sample questions:
     - *“What did we decide about Qdrant costs?”* → Inspect `Memory 1` and `Memory 2` evidence quotes.
     - *“What do I need to do by Friday?”* → Inspect Priya’s caching benchmark task and linked memories.
     - *“What changed since the previous API review?”* → View the side-by-side temporal change comparison (`Thursday, Oct 1 → Friday, Oct 9`).
   - Run *“What is my personal spending reminder?”* in `Engineering Workspace` to prove `Memory 3 (Private)` is blocked, then switch the workspace selector to `Personal Vault (Private)` and re-run to show authorized private retrieval.
4. **Action Items & Memory Lifecycle (3:30 – 5:00)**:
   - Visit **Action Items (`/actions`)**, inspect the deadline change activity note (`Deadline updated: Thursday, Oct 1 → Friday, Oct 9`), and update a task status from `Open` to `In progress` (verifying the Dashboard counter updates).
   - Visit **Memory Explorer (`/memories`)** and **Settings (`/settings`)** to review the 12-step architecture flow and Qdrant/Lyzr configuration contracts.
