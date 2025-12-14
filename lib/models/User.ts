import clientPromise from '../mongodb';

export interface User {
  _id?: string;
  auth0Id: string;
  email: string;
  name: string;
  role: 'consultant' | 'business';
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserByAuth0Id(auth0Id: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection<User>('users').findOne({ auth0Id });
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection<User>('users').findOne({ email });
  return user;
}

export async function createUser(userData: {
  auth0Id: string;
  email: string;
  name: string;
  role: 'consultant' | 'business';
}): Promise<User> {
  const client = await clientPromise;
  const db = client.db();
  
  const newUser: Omit<User, '_id'> = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection<User>('users').insertOne(newUser as User);
  return { ...newUser, _id: result.insertedId.toString() };
}

export async function updateUser(auth0Id: string, updates: Partial<User>): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  
  const result = await db.collection<User>('users').findOneAndUpdate(
    { auth0Id },
    { 
      $set: { 
        ...updates, 
        updatedAt: new Date() 
      } 
    },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

