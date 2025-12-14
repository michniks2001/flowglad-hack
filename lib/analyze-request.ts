import { getConsultingRequestById, updateConsultingRequest } from '@/lib/models/ConsultingRequest';
import { analyzeProject } from '@/lib/project-analyzer';
import { analyzeRepository } from '@/lib/gemini';
import { mapServicesToProposal } from '@/lib/flowglad';
import { saveProposalAsync } from '@/lib/store';
import { isGitHubUrl } from '@/lib/website';

// Shared function to analyze a consulting request
export async function analyzeConsultingRequest(requestId: string, projectUrl: string) {
  const request = await getConsultingRequestById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  // Update status to analyzing
  await updateConsultingRequest(requestId, { status: 'analyzing' });

  try {
    if (!isGitHubUrl(projectUrl)) {
      throw new Error('Only GitHub repository URLs are supported. Please provide a github.com URL.');
    }
    // Analyze the project
    const projectData = await analyzeProject(projectUrl);
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
      files: projectData.files,
    });
    const { uiConfiguration, ...analysis } = analysisWithUi as any;

    // Generate proposal
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

