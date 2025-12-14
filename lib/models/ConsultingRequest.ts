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
  
  const newRequest: Omit<ConsultingRequest, '_id'> = {
    ...requestData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<ConsultingRequest>('consulting_requests').insertOne(newRequest as ConsultingRequest);
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

  const requests = await db.collection<ConsultingRequest>('consulting_requests')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
  
  return requests;
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
  
  const request = await db.collection<ConsultingRequest>('consulting_requests').findOne({ _id: objectId });
  
  // Convert ObjectId to string for consistency
  if (request && request._id) {
    return { ...request, _id: request._id.toString() };
  }
  
  return null;
}

export async function updateConsultingRequest(
  id: string,
  updates: Partial<ConsultingRequest>
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
  
  const result = await db.collection<ConsultingRequest>('consulting_requests').findOneAndUpdate(
    { _id: objectId },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  // Convert ObjectId to string for consistency
  if (result && result._id) {
    return { ...result, _id: result._id.toString() };
  }
  
  return null;
}

