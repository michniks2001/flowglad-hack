import clientPromise from '../mongodb';
import { ObjectId } from 'mongodb';

export interface ConsultingRequest {
  _id?: string;
  businessId: string; // Auth0 ID of the business
  businessName: string;
  businessEmail: string;
  consultantEmail?: string; // email the business wants to send to
  projectUrl: string;
  projectType: 'github' | 'website';
  status: 'pending' | 'analyzing' | 'proposal_ready' | 'accepted' | 'rejected';
  proposalId?: string;
  consultantId?: string; // Auth0 ID of assigned consultant
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB document shape (ObjectId in DB, string in app/interface)
type ConsultingRequestDoc = Omit<ConsultingRequest, '_id'> & { _id?: ObjectId };
type ConsultingRequestDocWithId = Omit<ConsultingRequest, '_id'> & { _id: ObjectId };
type ConsultingRequestInsert = Omit<ConsultingRequestDoc, '_id'>;

export async function createConsultingRequest(requestData: {
  businessId: string;
  businessName: string;
  businessEmail: string;
  consultantEmail?: string;
  consultantId?: string;
  projectUrl: string;
  projectType: 'github' | 'website';
}): Promise<ConsultingRequest> {
  const client = await clientPromise;
  const db = client.db();
  
  const newRequest: ConsultingRequestInsert = {
    ...requestData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<ConsultingRequestDoc>('consulting_requests').insertOne(newRequest);
  return { ...newRequest, _id: result.insertedId.toString() };
}

export async function getConsultingRequests(filters?: {
  businessId?: string;
  consultantId?: string;
  status?: ConsultingRequest['status'];
}): Promise<ConsultingRequest[]> {
  const client = await clientPromise;
  const db = client.db();
  
  const query: any = {};
  if (filters?.businessId) query.businessId = filters.businessId;
  if (filters?.consultantId) query.consultantId = filters.consultantId;
  if (filters?.status) query.status = filters.status;

  const requests = await db.collection<ConsultingRequestDocWithId>('consulting_requests')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  
  return requests.map((r) => ({ ...r, _id: r._id.toString() }));
}

export async function getConsultingRequestById(id: string): Promise<ConsultingRequest | null> {
  const client = await clientPromise;
  const db = client.db();
  
  // Convert string ID to ObjectId for MongoDB query
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    console.error('Invalid ObjectId:', id);
    return null;
  }
  
  const request = await db.collection<ConsultingRequestDocWithId>('consulting_requests').findOne({ _id: objectId });
  
  // Convert ObjectId to string for consistency
  if (request && request._id) {
    return { ...request, _id: request._id.toString() };
  }
  
  return null;
}

export async function updateConsultingRequest(
  id: string,
  updates: Partial<Omit<ConsultingRequest, '_id'>>
): Promise<ConsultingRequest | null> {
  const client = await clientPromise;
  const db = client.db();
  
  // Convert string ID to ObjectId for MongoDB query
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    console.error('Invalid ObjectId:', id);
    return null;
  }
  
  // Never allow updating the MongoDB _id field.
  const { ...safeUpdates } = updates;

  const updated = await db.collection<ConsultingRequestDocWithId>('consulting_requests').findOneAndUpdate(
    { _id: objectId },
    { 
      $set: { 
        ...safeUpdates, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  if (updated && updated._id) {
    return { ...updated, _id: updated._id.toString() };
  }
  
  return null;
}

