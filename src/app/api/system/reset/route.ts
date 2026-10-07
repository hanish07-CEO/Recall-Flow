import { NextResponse } from 'next/server';
import { getQdrantRepository } from '@/lib/adapters/qdrant';

export async function POST() {
  try {
    const repo = getQdrantRepository();
    await repo.resetToSeed();
    return NextResponse.json({
      success: true,
      message: 'Successfully reset Qdrant demo store to baseline seed memories.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to reset seed state' },
      { status: 500 }
    );
  }
}
