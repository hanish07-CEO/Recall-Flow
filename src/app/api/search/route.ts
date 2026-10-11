import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { getLyzrWorkflow } from '@/lib/adapters/lyzr';
import { resolveCaller } from '@/lib/auth/caller';

const SearchSchema = z.object({
  query: z.string().trim().min(1, 'Query is required').max(500, 'Query is too long'),
});

export async function POST(req: NextRequest) {
  try {
    const caller = resolveCaller(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
    }
    const parsed = SearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid request' },
        { status: 400 }
      );
    }

    // Identity and scopes come from the server-side caller, never from the request body.
    const response = await getLyzrWorkflow().answerQuestion(
      parsed.data.query,
      caller.userId,
      caller.workspaceId,
      caller.allowedScopes,
      getQdrantRepository()
    );

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('[search]', error);
    return NextResponse.json({ success: false, error: 'Search execution failed' }, { status: 500 });
  }
}
