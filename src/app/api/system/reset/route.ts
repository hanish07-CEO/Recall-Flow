import { NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';

export async function POST() {
  try {
    const repo = getQdrantRepository();
    // Resetting is a demo-only convenience; never allow it against a live store.
    if (!repo.isDemo) {
      return NextResponse.json(
        { success: false, error: 'Reset is only available in Demo Mode' },
        { status: 403 }
      );
    }
    await repo.resetToSeed();
    return NextResponse.json({
      success: true,
      message: 'Successfully reset the demo store to baseline seed memories.',
    });
  } catch (error) {
    console.error('[system:reset]', error);
    return NextResponse.json({ success: false, error: 'Failed to reset seed state' }, { status: 500 });
  }
}
