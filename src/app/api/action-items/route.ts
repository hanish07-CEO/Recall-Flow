import { NextRequest, NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';
import { ActionItemRecord } from '@/lib/models/actionItem';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const workspaceId = searchParams.get('workspaceId') || undefined;
    const status = searchParams.get('status') || undefined;

    const repository = getQdrantRepository();
    const items = await repository.listActionItems({ userId, workspaceId, status });

    return NextResponse.json({
      success: true,
      count: items.length,
      actionItems: items,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to list action items' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'id and status are required' },
        { status: 400 }
      );
    }

    const repository = getQdrantRepository();
    const updated = await repository.updateActionItemStatus(
      id,
      status as ActionItemRecord['status']
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Action item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      actionItem: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update action item' },
      { status: 500 }
    );
  }
}
