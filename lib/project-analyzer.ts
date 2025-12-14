import { analyzeRepo, RepoData } from './github';
import { analyzeWebsite, isGitHubUrl, WebsiteData } from './website';

export interface ProjectData {
  name: string;
  description: string;
  content: string;
  dependencies: string[];
  techStack: string[];
  source: 'github' | 'website';
  url: string;
}

/**
 * Analyzes either a GitHub repository or a website
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
    };
  } else {
    console.log('Detected website URL, analyzing website...');
    const websiteData = await analyzeWebsite(url);
    
    return {
      name: websiteData.title || new URL(websiteData.url).hostname,
      description: websiteData.description || 'Website',
      content: websiteData.content,
      dependencies: [], // Websites don't have package.json dependencies
      techStack: websiteData.techStack,
      source: 'website',
      url: websiteData.url,
    };
  }
}

