import { NextResponse } from 'next/server';
import { analyzeConsultingRequest } from '@/lib/analyze-request';

// Background job to analyze a consulting request
export async function POST(req: Request) {
  try {
    const { requestId, projectUrl } = await req.json();

    if (!requestId || !projectUrl) {
      return NextResponse.json(
        { error: 'Missing requestId or projectUrl' },
        { status: 400 }
      );
    }

    const result = await analyzeConsultingRequest(requestId, projectUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error analyzing request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze request' },
      { status: 500 }
    );
  }
}

