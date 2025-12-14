import { NextResponse } from 'next/server';
import { analyzeProject } from '@/lib/project-analyzer';
import { analyzeRepository } from '@/lib/gemini';
import { mapServicesToProposal } from '@/lib/flowglad';
import { saveProposalAsync } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { githubUrl, consultantEmail } = await req.json();
    const projectUrl = githubUrl; // Keep variable name for compatibility

    if (!projectUrl) {
      return NextResponse.json(
        { error: 'URL is required (GitHub repository or website)' },
        { status: 400 }
      );
    }

    console.log('Starting analysis for:', projectUrl);

    // Step 1: Fetch project data (GitHub or website)
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
    console.log('Step 2: Analyzing with Gemini (gemini-2.5-flash-lite)...');
    // Convert project data to format expected by Gemini analyzer
    const analysis = await analyzeRepository({
      repoName: projectData.name,
      readme: projectData.content,
      dependencies: projectData.dependencies,
      techStack: projectData.techStack,
      url: projectData.url,
      source: projectData.source,
    });
    console.log('Analysis complete:', {
      techStack: analysis.techStack.length,
      issues: analysis.issues.length,
      opportunities: analysis.opportunities.length,
    });

    // Step 3: Generate proposal structure
    console.log('Step 3: Generating proposal structure...');
    const proposalId = crypto.randomUUID();
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

