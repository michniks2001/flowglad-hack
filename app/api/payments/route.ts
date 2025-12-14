import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getPaymentsByProposalIds } from '@/lib/models/Payment';
import { getUserByAuth0Id } from '@/lib/models/User';

export async function GET(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserByAuth0Id(session.user.sub!);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const proposalIdsParam = searchParams.get('proposalIds') || '';
    const proposalIds = proposalIdsParam.split(',').map((s) => s.trim()).filter(Boolean);

    if (proposalIds.length === 0) {
      return NextResponse.json({ summaries: {} });
    }

    // Only consultants and businesses can query payments; businesses should only see their own in a stricter system.
    // For demo: allow both roles.
    if (user.role !== 'consultant' && user.role !== 'business') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    const payments = await getPaymentsByProposalIds(proposalIds);

    const summaries: Record<
      string,
      {
        totalCount: number;
        paidCount: number;
        pendingCount: number;
        failedCount: number;
        totalAmount: number;
        paidAmount: number;
        status: 'unpaid' | 'partial' | 'paid';
      }
    > = {};

    for (const pid of proposalIds) {
      const ps = payments.filter((p) => p.proposalId === pid);
      const totalCount = ps.length;
      const paid = ps.filter((p) => p.status === 'paid');
      const pending = ps.filter((p) => p.status === 'pending');
      const failed = ps.filter((p) => p.status === 'failed');
      const totalAmount = ps.reduce((sum, p) => sum + (p.amount || 0), 0);
      const paidAmount = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
      const status: 'unpaid' | 'partial' | 'paid' =
        totalCount === 0 ? 'unpaid' : paid.length === 0 ? 'unpaid' : paid.length === totalCount ? 'paid' : 'partial';

      summaries[pid] = {
        totalCount,
        paidCount: paid.length,
        pendingCount: pending.length,
        failedCount: failed.length,
        totalAmount,
        paidAmount,
        status,
      };
    }

    return NextResponse.json({ summaries });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}


