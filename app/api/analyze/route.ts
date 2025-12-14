import { NextResponse } from 'next/server';
import { analyzeProject } from '@/lib/project-analyzer';
import { analyzeRepository } from '@/lib/gemini';
import { mapServicesToProposal } from '@/lib/flowglad';
import { saveProposalAsync } from '@/lib/store';
import { isGitHubUrl } from '@/lib/website';

export async function POST(req: Request) {
  try {
    const { githubUrl, consultantEmail } = await req.json();
    const projectUrl = githubUrl; // Keep variable name for compatibility

    if (!projectUrl) {
      return NextResponse.json(
        { error: 'GitHub repository URL is required' },
        { status: 400 }
      );
    }
    if (!isGitHubUrl(projectUrl)) {
      return NextResponse.json(
        { error: 'Only GitHub repository URLs are supported. Please provide a github.com URL.' },
        { status: 400 }
      );
    }

    console.log('Starting analysis for:', projectUrl);

    // Step 1: Fetch project data (GitHub)
    console.log('Step 1: Fetching project data...');
    const projectData = await analyzeProject(projectUrl);
    console.log('Project data fetched:', {
      name: projectData.name,
      source: projectData.source,
      techStack: projectData.techStack,
      dependenciesCount: projectData.dependencies.length,
      contentLength: projectData.content.length,
    });

    // Step 2: Analyze with Gemini
    console.log('Step 2: Analyzing with Gemini (gemini-3-pro-preview)...');
    // Create proposalId early so we can use it as a deterministic UI variation seed.
    const proposalId = crypto.randomUUID();
    // Convert project data to format expected by Gemini analyzer
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
    console.log('Analysis complete:', {
      techStack: analysis.techStack.length,
      issues: analysis.issues.length,
      opportunities: analysis.opportunities.length,
    });

    // Step 3: Generate proposal structure
    console.log('Step 3: Generating proposal structure...');
    const services = mapServicesToProposal(analysis);
    console.log('Services mapped:', services.length);

    // Extract client name from project data
    const clientName = projectData.source === 'github' 
      ? projectData.name.split('/')[0] 
      : new URL(projectData.url).hostname.replace('www.', '').split('.')[0];

    const proposal = {
      id: proposalId,
      clientName: clientName,
      repoUrl: projectUrl,
      analysis,
      uiConfiguration,
      services,
      generatedAt: new Date().toISOString(),
    };

    // Step 4: Store proposal
    console.log('Step 4: Storing proposal...');
    await saveProposalAsync(proposal);
    console.log('Proposal stored with ID:', proposalId);

    return NextResponse.json({ proposalId, status: 'complete' });
  } catch (error: any) {
    console.error('Analysis error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to analyze repository',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

