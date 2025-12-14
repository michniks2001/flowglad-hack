// Simple in-memory store for proposals (use a database in production)
import type { Proposal } from '@/lib/types/proposal';

export type { Proposal } from '@/lib/types/proposal';

// In development, Next/Turbopack can reload modules and/or serve different route handlers
// in different workers. Keep an in-process cache on globalThis to survive HMR within a worker.
const globalAny = globalThis as any;
const proposalStore: Map<string, Proposal> =
  globalAny.__proposalStore ?? new Map<string, Proposal>();
globalAny.__proposalStore = proposalStore;

async function getProposalsCollection() {
  if (!process.env.MONGODB_URI) return null;
  // Avoid importing lib/mongodb.ts unless MONGODB_URI exists (it throws otherwise).
  const mod = await import('./mongodb');
  const clientPromise = mod.default;
  const client = await clientPromise;
  const db = client.db();
  return db.collection('proposals');
}

export function saveProposal(proposal: Proposal) {
  proposalStore.set(proposal.id, proposal);
  console.log(`Proposal saved: ${proposal.id} (Total proposals: ${proposalStore.size})`);
  return proposal.id;
}

export function getProposal(id: string): Proposal | undefined {
  const proposal = proposalStore.get(id);
  if (!proposal) {
    console.warn(`Proposal not found: ${id}. Available IDs: ${Array.from(proposalStore.keys()).join(', ') || 'none'}`);
  } else {
    console.log(`Proposal found: ${id}`);
  }
  return proposal;
}

export function getAllProposals(): Proposal[] {
  return Array.from(proposalStore.values());
}

export function getProposalCount(): number {
  return proposalStore.size;
}

// --- Mongo-backed async APIs (recommended for route handlers) ---

export async function saveProposalAsync(proposal: Proposal) {
  // Always write to in-memory cache
  saveProposal(proposal);

  const collection = await getProposalsCollection();
  if (!collection) return proposal.id;

  // Persist so other route handler workers can read it
  try {
    await collection.updateOne(
      { id: proposal.id },
      { $set: { ...proposal, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  } catch (e) {
    console.error('[store] Failed to persist proposal to MongoDB:', e);
  }

  return proposal.id;
}

export async function getProposalAsync(id: string): Promise<Proposal | undefined> {
  const cached = proposalStore.get(id);
  if (cached) return cached;

  const collection = await getProposalsCollection();
  if (!collection) return undefined;

  try {
    const doc = await collection.findOne({ id });
    if (!doc) return undefined;
    // Remove Mongo-specific fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, createdAt, updatedAt, ...rest } = doc as any;
    const proposal = rest as Proposal;
    proposalStore.set(id, proposal);
    return proposal;
  } catch (e) {
    console.error('[store] Failed to fetch proposal from MongoDB:', e);
    return undefined;
  }
}

export async function getAllProposalsAsync(): Promise<Proposal[]> {
  const collection = await getProposalsCollection();
  if (!collection) return getAllProposals();

  try {
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    return docs.map((doc: any) => {
      const { _id, createdAt, updatedAt, ...rest } = doc;
      return rest as Proposal;
    });
  } catch (e) {
    console.error('[store] Failed to list proposals from MongoDB:', e);
    return getAllProposals();
  }
}

export async function getProposalCountAsync(): Promise<number> {
  const collection = await getProposalsCollection();
  if (!collection) return getProposalCount();
  try {
    return await collection.countDocuments({});
  } catch (e) {
    console.error('[store] Failed to count proposals in MongoDB:', e);
    return getProposalCount();
  }
}

