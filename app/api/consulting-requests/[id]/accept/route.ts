import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getConsultingRequestById, updateConsultingRequest } from '@/lib/models/ConsultingRequest';
import { getUserByAuth0Id } from '@/lib/models/User';
import { analyzeProject } from '@/lib/project-analyzer';
import { analyzeRepository } from '@/lib/gemini';
import { mapServicesToProposal } from '@/lib/flowglad';
import { saveProposalAsync } from '@/lib/store';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const user = await getUserByAuth0Id(session.user.sub!);
    
    if (!user || user.role !== 'consultant') {
      return NextResponse.json(
        { error: 'Only consultants can accept requests' },
        { status: 403 }
      );
    }

    const request = await getConsultingRequestById(id);
    if (!request) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (request.consultantId) {
      return NextResponse.json(
        { error: 'Request already assigned' },
        { status: 400 }
      );
    }

    // Update request status and assign consultant
    await updateConsultingRequest(id, {
      consultantId: user.auth0Id,
      status: 'analyzing',
    });

    // Start analysis
    try {
      const projectData = await analyzeProject(request.projectUrl);
      // Create proposalId early so we can use it as a deterministic UI variation seed.
      const proposalId = crypto.randomUUID();
      const analysisWithUi = await analyzeRepository({
        repoName: projectData.name,
        readme: projectData.content,
        dependencies: projectData.dependencies,
        techStack: projectData.techStack,
        url: projectData.url,
        source: projectData.source,
        uiSeed: proposalId,
      });
      const { uiConfiguration, ...analysis } = analysisWithUi as any;

      const services = mapServicesToProposal(analysis);

      const proposal = {
        id: proposalId,
        clientName: request.businessName,
        repoUrl: request.projectUrl,
        analysis,
        uiConfiguration,
        services,
        generatedAt: new Date().toISOString(),
      };

      await saveProposalAsync(proposal);

      // Update request with proposal ID
      await updateConsultingRequest(id, {
        proposalId,
        status: 'proposal_ready',
      });

      return NextResponse.json({
        success: true,
        proposalId,
        request: await getConsultingRequestById(id),
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      await updateConsultingRequest(id, {
        status: 'pending',
        consultantId: undefined,
      });
      throw error;
    }
  } catch (error: any) {
    console.error('Error accepting request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept request' },
      { status: 500 }
    );
  }
}

