import { analyzeRepo } from './github';
import { isGitHubUrl } from './website';

export interface ProjectData {
  name: string;
  description: string;
  content: string;
  dependencies: string[];
  techStack: string[];
  source: 'github';
  url: string;
  files?: Array<{ path: string; content: string; truncated?: boolean }>;
}

/**
 * Analyzes a GitHub repository (DeepScan currently supports GitHub repos only)
 */
export async function analyzeProject(url: string): Promise<ProjectData> {
  if (isGitHubUrl(url)) {
    console.log('Detected GitHub URL, analyzing repository...');
    const repoData = await analyzeRepo(url);
    
    return {
      name: repoData.repoName,
      description: repoData.readme.substring(0, 500) || 'GitHub repository',
      content: repoData.readme,
      dependencies: repoData.dependencies,
      techStack: repoData.techStack,
      source: 'github',
      url: url,
      files: repoData.files,
    };
  }

  throw new Error('Only GitHub repository URLs are supported. Please provide a github.com URL.');
}

