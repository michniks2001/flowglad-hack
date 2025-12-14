import { NextResponse } from 'next/server';
import { getProposalAsync } from '@/lib/store';
import { getMockProposal } from '@/lib/mock-data';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[API /api/proposal] Fetching proposal with ID:', id);

    // Hard demo fallback: demo proposal should always be available and not depend on DB/in-memory state.
    if (id === 'demo') {
      const demo = getMockProposal();
      return NextResponse.json(demo);
    }
    
    const proposal = await getProposalAsync(id);

    if (!proposal) {
      console.warn('[API /api/proposal] Proposal not found:', id);
      return NextResponse.json(
        { 
          error: 'Proposal not found',
          message: 'The proposal ID is invalid or the proposal is no longer available.',
          id 
        },
        { status: 404 }
      );
    }

    console.log('[API /api/proposal] Proposal found:', proposal.id);
    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error('[API /api/proposal] Error fetching proposal:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch proposal',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

