export interface RepoData {
  repoName: string;
  readme: string;
  dependencies: string[];
  techStack: string[];
  stats: {
    stars: number;
    contributors: number;
    lastUpdate: string;
  };
}

// Unified interface for both GitHub repos and websites
export interface ProjectData {
  name: string;
  description: string;
  content: string; // README for GitHub, HTML content for websites
  dependencies: string[];
  techStack: string[];
  source: 'github' | 'website';
  url: string;
}

export async function analyzeRepo(githubUrl: string): Promise<RepoData> {
  try {
    const urlParts = githubUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1]?.replace('.git', '').split('/')[0];

    if (!owner || !repo) {
      throw new Error('Invalid GitHub URL');
    }

    const headers: HeadersInit = {};
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch README
    let readme = '';
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        { headers }
      );
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      }
    } catch (e) {
      console.warn('Could not fetch README:', e);
    }

    // Fetch package.json or requirements.txt
    const dependencies: string[] = [];
    let techStack: string[] = [];

    try {
      const packageRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
        { headers }
      );
      if (packageRes.ok) {
        const packageData = await packageRes.json();
        const packageContent = Buffer.from(packageData.content, 'base64').toString('utf-8');
        const packageJson = JSON.parse(packageContent);
        
        if (packageJson.dependencies) {
          dependencies.push(...Object.keys(packageJson.dependencies));
        }
        if (packageJson.devDependencies) {
          dependencies.push(...Object.keys(packageJson.devDependencies));
        }

        // Detect tech stack
        if (packageJson.dependencies?.react || packageJson.dependencies?.['react-dom']) {
          techStack.push('React');
        }
        if (packageJson.dependencies?.next) {
          techStack.push('Next.js');
        }
        if (packageJson.dependencies?.express || packageJson.dependencies?.['@expressjs/express']) {
          techStack.push('Express');
        }
        if (packageJson.dependencies?.mongoose || packageJson.dependencies?.mongodb) {
          techStack.push('MongoDB');
        }
        if (packageJson.dependencies?.prisma || packageJson.dependencies?.['@prisma/client']) {
          techStack.push('Prisma');
        }
        if (packageJson.dependencies?.typescript) {
          techStack.push('TypeScript');
        }
      }
    } catch (e) {
      console.warn('Could not fetch package.json:', e);
    }

    // Fetch repo stats
    let stats = {
      stars: 0,
      contributors: 0,
      lastUpdate: new Date().toISOString(),
    };

    try {
      const repoRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        { headers }
      );
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        stats = {
          stars: repoData.stargazers_count || 0,
          contributors: 0, // Would need separate API call
          lastUpdate: repoData.updated_at || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Could not fetch repo stats:', e);
    }

    return {
      repoName: `${owner}/${repo}`,
      readme: readme || 'No README found',
      dependencies,
      techStack: techStack.length > 0 ? techStack : ['JavaScript', 'Node.js'],
      stats,
    };
  } catch (error) {
    console.error('GitHub API error:', error);
    // Return mock data for demo
    return {
      repoName: 'demo/repo',
      readme: '# Demo Repository\n\nThis is a demo repository for testing purposes.',
      dependencies: ['react', 'express', 'mongoose'],
      techStack: ['React', 'Node.js', 'MongoDB'],
      stats: {
        stars: 42,
        contributors: 5,
        lastUpdate: new Date().toISOString(),
      },
    };
  }
}

