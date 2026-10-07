import { OmiWebhookPayload } from '../../models/omi';

export interface SimulatorPreset {
  id: string;
  name: string;
  description: string;
  payload: OmiWebhookPayload;
}

export const SIMULATOR_PRESETS: SimulatorPreset[] = [
  {
    id: 'preset-primary-target',
    name: 'Primary Target Scenario: API Review & Caching',
    description: 'Priya commits to caching benchmark by Friday; references last Tuesday’s Qdrant cost meeting.',
    payload: {
      eventId: 'evt-omi-target-001',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-20261006-api-review',
      timestamp: '2026-10-06T15:00:00.000Z',
      transcript: 'During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.',
      privacyScope: 'team',
      retentionPolicy: '30d',
    },
  },
  {
    id: 'preset-do-not-retain',
    name: 'Zero-Retention / Ephemeral Memory',
    description: 'Off-the-record discussion with do_not_retain policy. Not saved to Qdrant.',
    payload: {
      eventId: 'evt-omi-ephemeral-002',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-20261006-off-the-record',
      timestamp: '2026-10-06T16:30:00.000Z',
      transcript: 'Off the record: verifying access to secret API key sk_live_998877665544 for temporary benchmark run.',
      privacyScope: 'do_not_retain',
      retentionPolicy: 'ephemeral_session',
    },
  },
  {
    id: 'preset-confidential-exec',
    name: 'Confidential Executive Memo',
    description: 'Confidential executive memory. Invisible to regular searchers.',
    payload: {
      eventId: 'evt-omi-confidential-003',
      source: 'omi_simulator',
      userId: 'user-admin',
      workspaceId: 'workspace-default',
      sessionId: 'session-20261006-exec-brief',
      timestamp: '2026-10-06T17:00:00.000Z',
      transcript: 'Confidential executive committee update: approved 15% equity expansion and special leadership retention pools.',
      privacyScope: 'confidential',
      retentionPolicy: 'forever',
    },
  },
];
