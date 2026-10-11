import { NextRequest, NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { IngestionService, toClientResponse } from '@/lib/services/ingestionService';
import { resolveCaller } from '@/lib/auth/caller';
import { HttpError } from '@/lib/errors';

/**
 * Demo Omi Event Simulator. Runs the exact same IngestionService as POST /api/omi/webhook,
 * but only when the simulated (demo) repository is active, and always attributes the event to the
 * resolved caller rather than to whatever userId the body claims.
 */
export async function POST(req: NextRequest) {
  try {
    if (!getQdrantRepository().isDemo) {
      return NextResponse.json(
        { success: false, error: 'Simulator is only available in Demo Mode' },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const caller = resolveCaller(req);
    const payload = {
      ...(body as Record<string, unknown>),
      userId: caller.userId,
      workspaceId: caller.workspaceId,
      source: 'omi_simulator',
    };

    const output = await IngestionService.ingestOmiEvent(payload, null, { skipSecret: true });
    return NextResponse.json(toClientResponse(output), { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[omi-simulate] unexpected error', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
