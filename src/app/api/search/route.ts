import { NextRequest, NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { getLyzrWorkflow } from '@/lib/adapters/lyzr';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, userId = 'user-default', workspaceId = 'workspace-default', allowedScopes = ['public', 'team'] } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'Query is required' }, { status: 400 });
    }

    const repository = getQdrantRepository();
    const workflow = getLyzrWorkflow();

    const response = await workflow.answerQuestion(
      query,
      userId,
      workspaceId,
      allowedScopes,
      repository
    );

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Search execution failed' },
      { status: 500 }
    );
  }
}
