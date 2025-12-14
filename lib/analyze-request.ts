import { getConsultingRequestById, updateConsultingRequest } from '@/lib/models/ConsultingRequest';
import { analyzeProject } from '@/lib/project-analyzer';
import { analyzeRepository } from '@/lib/gemini';
import { mapServicesToProposal } from '@/lib/flowglad';
import { saveProposalAsync } from '@/lib/store';

// Shared function to analyze a consulting request
export async function analyzeConsultingRequest(requestId: string, projectUrl: string) {
  const request = await getConsultingRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  // Update status to analyzing
  await updateConsultingRequest(requestId, { status: 'analyzing' });

  try {
    // Analyze the project
    const projectData = await analyzeProject(projectUrl);
    const analysisWithUi = await analyzeRepository({
      repoName: projectData.name,
      readme: projectData.content,
      dependencies: projectData.dependencies,
      techStack: projectData.techStack,
      url: projectData.url,
      source: projectData.source,
    });
    const { uiConfiguration, ...analysis } = analysisWithUi as any;

    // Generate proposal
    const proposalId = crypto.randomUUID();
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

    // Update request with proposal
    await updateConsultingRequest(requestId, {
      proposalId,
      status: 'proposal_ready',
    });

    return { success: true, proposalId };
  } catch (error: any) {
    console.error('Analysis error:', error);
    await updateConsultingRequest(requestId, { status: 'pending' });
    throw error;
  }
}

