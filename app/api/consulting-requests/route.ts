import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { createConsultingRequest, getConsultingRequests } from '@/lib/models/ConsultingRequest';
import { getUserByAuth0Id, getUserByEmail } from '@/lib/models/User';
import { isGitHubUrl } from '@/lib/website';

export async function GET(req: Request) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const businessOnly = searchParams.get('business') === 'true';

    const user = await getUserByAuth0Id(session.user.sub!);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let requests;
    if (user.role === 'business' && businessOnly) {
      // Business sees only their requests
      requests = await getConsultingRequests({ businessId: user.auth0Id });
    } else if (user.role === 'consultant') {
      // Consultant sees all requests
      requests = await getConsultingRequests();
    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 403 }
      );
    }

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = await getUserByAuth0Id(session.user.sub!);
    if (!user || user.role !== 'business') {
      return NextResponse.json(
        { error: 'Only businesses can create requests' },
        { status: 403 }
      );
    }

    const { projectUrl, consultantEmail } = await req.json();

    if (!projectUrl) {
      return NextResponse.json(
        { error: 'Project URL is required' },
        { status: 400 }
      );
    }

    if (!consultantEmail || typeof consultantEmail !== 'string') {
      return NextResponse.json(
        { error: 'Consultant email is required' },
        { status: 400 }
      );
    }

    const normalizedConsultantEmail = consultantEmail.trim().toLowerCase();
    const consultantUser = await getUserByEmail(normalizedConsultantEmail);
    if (!consultantUser || consultantUser.role !== 'consultant') {
      return NextResponse.json(
        { error: 'No consultant found with that email' },
        { status: 400 }
      );
    }

    if (!isGitHubUrl(projectUrl)) {
      return NextResponse.json(
        { error: 'Only GitHub repository URLs are supported. Please provide a github.com URL.' },
        { status: 400 }
      );
    }
    const projectType = 'github';

    const request = await createConsultingRequest({
      businessId: user.auth0Id,
      businessName: user.name,
      businessEmail: user.email,
      consultantEmail: normalizedConsultantEmail,
      consultantId: consultantUser.auth0Id, // auto-assign so it shows up in consultant dashboard immediately
      projectUrl,
      projectType,
    });

    // Trigger analysis in background (fire and forget)
    // Wait a tiny bit to ensure the request is fully saved, then analyze
    if (request._id) {
      setTimeout(() => {
        import('@/lib/analyze-request').then(({ analyzeConsultingRequest }) => {
          analyzeConsultingRequest(request._id!, projectUrl).catch((error) => {
            console.error('Failed to analyze request:', error);
          });
        });
      }, 100); // Small delay to ensure DB write is complete
    }

    return NextResponse.json({ request });
  } catch (error: any) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create request' },
      { status: 500 }
    );
  }
}

