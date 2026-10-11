import { NextRequest, NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { narrowScopes, resolveCaller } from '@/lib/auth/caller';

export async function GET(req: NextRequest) {
  try {
    const caller = resolveCaller(req);
    const { searchParams } = new URL(req.url);
    const requested = searchParams.get('scopes')?.split(',').map((s) => s.trim()).filter(Boolean);

    // The caller's server-side entitlement is authoritative; the query can only narrow it.
    const privacyScopes = narrowScopes(requested, caller.allowedScopes);

    const repository = getQdrantRepository();
    const memories = await repository.listMemories({
      workspaceId: caller.workspaceId,
      privacyScopes,
    });

    return NextResponse.json({
      success: true,
      count: memories.length,
      memories,
    });
  } catch (error) {
    console.error('[memories:list]', error);
    return NextResponse.json({ success: false, error: 'Failed to list memories' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const caller = resolveCaller(req);
    const memoryId = new URL(req.url).searchParams.get('memoryId');
    if (!memoryId) {
      return NextResponse.json({ success: false, error: 'memoryId is required' }, { status: 400 });
    }

    const repository = getQdrantRepository();
    const memory = await repository.getMemory(memoryId);

    // Unknown, other-workspace and out-of-scope records are indistinguishable from "not found".
    if (
      !memory ||
      memory.workspaceId !== caller.workspaceId ||
      !caller.allowedScopes.includes(memory.privacyScope)
    ) {
      return NextResponse.json({ success: false, error: 'Memory not found' }, { status: 404 });
    }
    if (!caller.isAdmin && memory.userId !== caller.userId) {
      return NextResponse.json({ success: false, error: 'Only the owner or an admin can delete this memory' }, { status: 403 });
    }

    const deleted = await repository.deleteMemory(memoryId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    console.error('[memories:delete]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete memory' }, { status: 500 });
  }
}
