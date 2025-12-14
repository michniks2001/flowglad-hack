import { NextResponse } from 'next/server';
import { getAllProposalsAsync, getProposalCountAsync } from '@/lib/store';

// Debug endpoint to list all proposals (only in development)
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    );
  }

  const proposals = await getAllProposalsAsync();
  const count = await getProposalCountAsync();

  return NextResponse.json({
    count,
    proposals: proposals.map((p) => ({
      id: p.id,
      clientName: p.clientName,
      repoUrl: p.repoUrl,
      generatedAt: p.generatedAt,
      issuesCount: p.analysis.issues.length,
      opportunitiesCount: p.analysis.opportunities.length,
      servicesCount: p.services.length,
    })),
  });
}

