import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { resolveCaller } from '@/lib/auth/caller';

const STATUSES = ['open', 'in_progress', 'completed', 'cancelled'] as const;
const PatchSchema = z.object({
  id: z.string().min(1).max(200),
  status: z.enum(STATUSES),
});

export async function GET(req: NextRequest) {
  try {
    const caller = resolveCaller(req);
    const statusParam = new URL(req.url).searchParams.get('status') || undefined;
    if (statusParam && !(STATUSES as readonly string[]).includes(statusParam)) {
      return NextResponse.json({ success: false, error: 'Invalid status filter' }, { status: 400 });
    }

    const repository = getQdrantRepository();
    const items = await repository.listActionItems({
      userId: caller.userId,
      workspaceId: caller.workspaceId,
      status: statusParam,
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      actionItems: items,
    });
  } catch (error) {
    console.error('[action-items:list]', error);
    return NextResponse.json({ success: false, error: 'Failed to list action items' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const caller = resolveCaller(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
    }
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'id and a valid status are required' },
        { status: 400 }
      );
    }

    const repository = getQdrantRepository();
    const existing = await repository.getActionItem(parsed.data.id);
    if (!existing || existing.workspaceId !== caller.workspaceId) {
      return NextResponse.json({ success: false, error: 'Action item not found' }, { status: 404 });
    }
    if (!caller.isAdmin && existing.userId !== caller.userId && existing.userId !== 'user-default') {
      return NextResponse.json({ success: false, error: 'Not allowed to modify this action item' }, { status: 403 });
    }

    const updated = await repository.updateActionItemStatus(parsed.data.id, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Action item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, actionItem: updated });
  } catch (error) {
    console.error('[action-items:patch]', error);
    return NextResponse.json({ success: false, error: 'Failed to update action item' }, { status: 500 });
  }
}
