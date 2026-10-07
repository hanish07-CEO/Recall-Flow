# RecallFlow 🎙️🧠

**RecallFlow** is a privacy-aware, voice-first meeting and knowledge-memory copilot. It ingests voice-originated transcript events from **Omi**, stores approved long-term semantic memories in **Qdrant**, and uses a **Lyzr** multi-agent workflow to retrieve context, extract action items, detect changes, enforce privacy, and produce evidence-backed answers.

The application works out of the box in **Demo Mode** with a deterministic in-memory vector repository and simulated Lyzr multi-agent workflow, while providing clean production-ready adapters for real Omi hardware, Qdrant Cloud, and Lyzr Agent APIs.

---

## 🚀 Key Features

1. **Omi Voice Ingestion Layer**:
   - `POST /api/omi/webhook` handles incoming audio transcript events.
   - Validates event payload (`eventId`, `userId`, `workspaceId`, `sessionId`, `timestamp`, `transcript`, `privacyScope`, `retentionPolicy`).
   - Optional cryptographic webhook-secret verification (`x-omi-secret`).
   - Integrated **Demo Omi Event Simulator** calling the exact same shared ingestion service as the real hardware webhook.
   - Status indicators: `Omi Connected`, `Demo Mode`, `Webhook Unavailable`.

2. **Qdrant Semantic Memory Repository**:
   - Manages collections: `recallflow_memories` and `recallflow_action_items`.
   - Granular privacy scopes: `public`, `team`, `confidential`, `do_not_retain`.
   - Retention policy enforcement: `forever`, `30d`, `7d`, `ephemeral_session`.
   - Production adapter for live Qdrant clusters + deterministic in-memory adapter for Demo Mode.

3. **Lyzr Multi-Agent Workflow Engine**:
   - **PrivacyEnforcementAgent**: Classifies sensitivity, enforces zero-retention (`do_not_retain`), scrubs secrets/tokens.
   - **ContextRetrievalAgent**: Queries semantic vector memories to locate historical precedents.
   - **ActionExtractionAgent**: Extracts commitments, owners, due dates, priority, and status.
   - **ChangeDetectionAgent**: Compares new commitments against historical sprint records to detect timeline or scope shifts (e.g., caching deadline moved from Thursday to Friday).
   - **EvidenceSynthesizerAgent**: Produces evidence-grounded answers citing exact meeting timestamps and session IDs with confidence ratings.
   - **Live Workflow Trace Viewer**: Visualizes step-by-step agent thoughts, inputs, outputs, and execution duration.

---

## 🎯 Target Hackathon User Journey

When a user speaks:
> *"During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday."*

RecallFlow automatically:
1. Validates the incoming voice transcript via the shared Ingestion Service.
2. Extracts:
   - **Task**: Benchmark caching
   - **Owner**: Priya
   - **Due Date**: Friday, October 9, 2026
   - **Priority**: High
   - **Status**: Open
3. Retrieves historical context from Tuesday, September 29, 2026 discussing uncompressed vectors and Qdrant cluster costs.
4. Detects timeline change: Priya's caching benchmark was previously committed for Thursday, October 8, 2026; updates and badges the delta.
5. Emits verifiable citations, timestamps, and confidence score.
6. Renders the 5-agent execution trace in real time.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS, Lucide React icons
- **Validation**: Zod
- **Testing**: Vitest (100% pass across all unit and integration test suites)

---

## 📦 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables (Optional for Live Production Cloud)

Create a `.env.local` file to switch from Demo Mode to live cloud connections:

```env
# Mode toggle ('demo' or 'production')
RECALLFLOW_MODE=production

# Omi Webhook Secret (if configured on Omi developer portal)
OMI_WEBHOOK_SECRET=your_omi_secret_here

# Qdrant Cloud Connection
QDRANT_URL=https://your-cluster-id.us-east4-0.gcp.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key_here

# Lyzr Agent API Connection
LYZR_API_KEY=your_lyzr_api_key_here
```

When credentials are omitted, the app automatically runs in **Demo Mode** with explicit UI indicators and complete functionality.
