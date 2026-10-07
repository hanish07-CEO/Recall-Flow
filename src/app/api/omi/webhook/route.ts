import { NextRequest, NextResponse } from 'next/server';
import { IngestionService } from '@/lib/services/ingestionService';

export async function POST(req: NextRequest) {
  try {
    const secretHeader = req.headers.get('x-omi-secret') || req.headers.get('authorization');
    const body = await req.json();

    const output = await IngestionService.ingestOmiEvent(body, secretHeader);

    return NextResponse.json(output, { status: 200 });
  } catch (error: any) {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Internal Server Error during Omi ingestion';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}
