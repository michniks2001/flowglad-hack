import clientPromise from '../mongodb';
import { ObjectId } from 'mongodb';

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentProvider = 'flowglad' | 'demo';

export interface Payment {
  _id?: string;
  paymentId: string; // our idempotency key
  proposalId: string;
  requestId?: string;
  businessId?: string;
  consultantId?: string;
  serviceId?: string;
  serviceName?: string;
  amount: number; // dollars for display (demo), not cents
  currency: string; // e.g. USD
  provider: PaymentProvider;
  status: PaymentStatus;
  checkoutSessionId?: string;
  checkoutUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
}

function paymentsCollection(db: any) {
  return db.collection<Payment>('payments');
}

export async function createPayment(input: Omit<Payment, '_id' | 'createdAt' | 'updatedAt'>) {
  const client = await clientPromise;
  const db = client.db();

  const now = new Date();
  const doc: Omit<Payment, '_id'> = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  // idempotent by paymentId
  await paymentsCollection(db).updateOne(
    { paymentId: doc.paymentId },
    { $set: { ...doc, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  return doc;
}

export async function updatePaymentByPaymentId(
  paymentId: string,
  updates: Partial<Payment>
): Promise<Payment | null> {
  const client = await clientPromise;
  const db = client.db();

  const result = await paymentsCollection(db).findOneAndUpdate(
    { paymentId },
    { $set: { ...updates, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  const payment = result as any;
  if (!payment) return null;
  if (payment._id) return { ...payment, _id: payment._id.toString() };
  return payment;
}

export async function markPaymentPaid(paymentId: string): Promise<Payment | null> {
  return await updatePaymentByPaymentId(paymentId, {
    status: 'paid',
    paidAt: new Date(),
  });
}

export async function getPaymentsByProposalIds(proposalIds: string[]): Promise<Payment[]> {
  const client = await clientPromise;
  const db = client.db();

  const payments = await paymentsCollection(db)
    .find({ proposalId: { $in: proposalIds } })
    .sort({ createdAt: -1 })
    .toArray();

  return payments.map((p: any) => (p._id ? { ...p, _id: p._id.toString() } : p));
}


