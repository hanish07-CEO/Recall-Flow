import { NextRequest, NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { PrivacyScope } from '@/lib/models/memory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const workspaceId = searchParams.get('workspaceId') || undefined;
    const scopeParam = searchParams.get('scopes');
    
    // Parse allowed scopes, default to public, team
    const privacyScopes: PrivacyScope[] = scopeParam
      ? (scopeParam.split(',') as PrivacyScope[])
      : ['public', 'team'];

    const repository = getQdrantRepository();
    const memories = await repository.listMemories({
      userId,
      workspaceId,
      privacyScopes,
    });

    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list memories' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get('memoryId');
    if (!memoryId) {
      return NextResponse.json({ success: false, error: 'memoryId is required' }, { status: 400 });
    }

    const repository = getQdrantRepository();
    const deleted = await repository.deleteMemory(memoryId);

    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
