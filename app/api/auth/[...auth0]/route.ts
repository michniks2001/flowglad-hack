import { NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

// Auth0 v4: Routes are handled by proxy.ts middleware
// This route handler exists only to satisfy Next.js routing
// All actual auth handling is done in proxy.ts
export async function GET(req: NextRequest) {
  // This should never be called because proxy.ts intercepts /api/auth/* routes
  // But if it is, delegate to the middleware
  return await auth0.middleware(req);
}

export async function POST(req: NextRequest) {
  return await GET(req);
}
