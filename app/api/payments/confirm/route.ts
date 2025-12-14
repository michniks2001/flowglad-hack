import { NextResponse } from 'next/server';
import { markPaymentPaid, updatePaymentByPaymentId } from '@/lib/models/Payment';

// Demo confirmation endpoint.
// In production you should validate this via Flowglad webhooks or signed return params.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { paymentId, provider, checkoutSessionId } = body || {};

    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    if (checkoutSessionId) {
      await updatePaymentByPaymentId(paymentId, { checkoutSessionId });
    }

    const payment = await markPaymentPaid(paymentId);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to confirm payment' }, { status: 500 });
  }
}


