import { NextRequest, NextResponse } from 'next/server';
import { IngestionService, toClientResponse } from '@/lib/services/ingestionService';
import { HttpError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get('x-omi-secret') || req.headers.get('authorization');

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON' }, { status: 400 });
    }

    const output = await IngestionService.ingestOmiEvent(body, secretHeader);
    return NextResponse.json(toClientResponse(output), { status: 200 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    console.error('[omi-webhook] unexpected error', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
