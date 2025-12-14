import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getUserByAuth0Id, createUser } from '@/lib/models/User';

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { sub: auth0Id, email, name } = session.user;

    if (!auth0Id || !email) {
      return NextResponse.json(
        { error: 'Missing user information' },
        { status: 400 }
      );
    }

    // Check if user exists
    let user = await getUserByAuth0Id(auth0Id);

    // If user doesn't exist, we need to create them
    // But we need to know their role - this should come from Auth0 metadata or a separate signup flow
    // For now, we'll check if they have a role in Auth0 app_metadata
    const role = (session.user as any).app_metadata?.role || 
                 (session.user as any).user_metadata?.role || 
                 null;

    if (!user && role) {
      // Create user with role from Auth0 metadata
      user = await createUser({
        auth0Id,
        email,
        name: name || email.split('@')[0],
        role: role as 'consultant' | 'business',
      });
    } else if (!user) {
      // User exists in Auth0 but not in our DB, and no role set
      // Return user info but indicate role needs to be set
      return NextResponse.json({
        user: null,
        needsRoleSelection: true,
        auth0User: { email, name },
      });
    }

    // Check if user exists but has no role (partial user creation)
    if (user && !user.role) {
      return NextResponse.json({
        user: null,
        needsRoleSelection: true,
        auth0User: { email, name },
      });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync user' },
      { status: 500 }
    );
  }
}

