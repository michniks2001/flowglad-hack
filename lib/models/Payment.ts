import clientPromise from '../mongodb';
import { ObjectId, type Db } from 'mongodb';

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

type PaymentDoc = Omit<Payment, '_id'> & { _id?: ObjectId };

function paymentsCollection(db: Db) {
  return db.collection<PaymentDoc>('payments');
}

export async function createPayment(input: Omit<Payment, '_id' | 'createdAt' | 'updatedAt'>) {
  const client = await clientPromise;
  const db = client.db();

  const now = new Date();
  const doc: Omit<PaymentDoc, '_id'> = {
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
  updates: Partial<Omit<Payment, '_id'>>
): Promise<Payment | null> {
  const client = await clientPromise;
  const db = client.db();

  // Never allow updating MongoDB _id
  // (and avoid typing mismatches: Payment._id is string, DB _id is ObjectId)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ...safeUpdates } = updates;

  const updated = await paymentsCollection(db).findOneAndUpdate(
    { paymentId },
    { $set: { ...safeUpdates, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!updated) return null;
  return updated._id ? ({ ...(updated as any), _id: updated._id.toString() } as Payment) : (updated as any);
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

  return payments.map((p) => (p._id ? ({ ...(p as any), _id: p._id.toString() } as Payment) : (p as any)));
}


