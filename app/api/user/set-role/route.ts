import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getUserByAuth0Id, createUser } from '@/lib/models/User';

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { sub: auth0Id, email, name } = session.user;
    const { role } = await req.json();

    if (!auth0Id || !email) {
      return NextResponse.json(
        { error: 'Missing user information' },
        { status: 400 }
      );
    }

    if (role !== 'consultant' && role !== 'business') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "consultant" or "business"' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await getUserByAuth0Id(auth0Id);

    if (!user) {
      // Create new user with selected role
      user = await createUser({
        auth0Id,
        email,
        name: name || email.split('@')[0],
        role: role as 'consultant' | 'business',
      });
    } else {
      // Update existing user's role (if they don't have one set)
      if (!user.role) {
        const { updateUser } = await import('@/lib/models/User');
        user = await updateUser(auth0Id, { role: role as 'consultant' | 'business' }) || user;
      }
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Set role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set role' },
      { status: 500 }
    );
  }
}

