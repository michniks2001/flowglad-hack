export interface RepoData {
  repoName: string;
  readme: string;
  dependencies: string[];
  techStack: string[];
  files?: Array<{
    path: string;
    content: string;
    truncated?: boolean;
  }>;
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
    headers['Accept'] = 'application/vnd.github+json';

    const fetchJson = async (url: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok) return null;
        return await res.json();
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const fetchTextFileFromContents = async (path: string, ref?: string) => {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
      const data: any = await fetchJson(url);
      if (!data || typeof data !== 'object') return null;
      // Skip directories or non-file content.
      if (data.type !== 'file') return null;
      if (typeof data.content !== 'string' || data.encoding !== 'base64') return null;
      const size = typeof data.size === 'number' ? data.size : 0;
      // Skip huge files
      if (size > 120_000) return null;
      try {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      } catch {
        return null;
      }
    };

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
    let defaultBranch: string | null = null;

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
        defaultBranch = repoData.default_branch || null;
      }
    } catch (e) {
      console.warn('Could not fetch repo stats:', e);
    }

    // --- Fetch a bounded set of real source/config files for code-aware analysis ---
    // We keep this small to avoid rate-limits + prompt token bloat.
    const files: Array<{ path: string; content: string; truncated?: boolean }> = [];
    const maxFiles = process.env.GITHUB_TOKEN ? 18 : 8;
    const perFileCharLimit = 8000;
    const totalCharBudget = process.env.GITHUB_TOKEN ? 45_000 : 20_000;

    try {
      if (defaultBranch) {
        // Resolve branch -> commit -> tree SHA
        const ref = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(defaultBranch)}`);
        const commitSha = ref?.object?.sha as string | undefined;
        if (commitSha) {
          const commit = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/commits/${encodeURIComponent(commitSha)}`);
          const treeSha = commit?.tree?.sha as string | undefined;
          if (treeSha) {
            const tree = await fetchJson(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`);
            const nodes: Array<{ path: string; type: string; size?: number }> = Array.isArray(tree?.tree) ? tree.tree : [];

            const denyPrefixes = [
              'node_modules/',
              '.next/',
              'dist/',
              'build/',
              'coverage/',
              '.git/',
              '.turbo/',
              'out/',
              'vendor/',
            ];
            const allowExt = new Set([
              '.ts',
              '.tsx',
              '.js',
              '.jsx',
              '.mjs',
              '.cjs',
              '.json',
              '.yml',
              '.yaml',
              '.md',
              '.py',
              '.go',
              '.java',
              '.rb',
              '.rs',
              '.prisma',
            ]);
            const important = [
              'package.json',
              'tsconfig.json',
              'next.config.js',
              'next.config.mjs',
              'tailwind.config.js',
              'tailwind.config.ts',
              'postcss.config.js',
              'eslint.config.js',
              'proxy.ts',
              'middleware.ts',
              'app/layout.tsx',
              'app/page.tsx',
              'src/app/layout.tsx',
              'src/app/page.tsx',
              'README.md',
              'prisma/schema.prisma',
            ];

            const isDenied = (p: string) => denyPrefixes.some((d) => p.startsWith(d));
            const extOf = (p: string) => {
              const i = p.lastIndexOf('.');
              return i >= 0 ? p.slice(i).toLowerCase() : '';
            };
            const isAllowed = (p: string) => allowExt.has(extOf(p)) || important.includes(p);

            const candidates = nodes
              .filter((n) => n.type === 'blob')
              .map((n) => ({ path: n.path, size: typeof n.size === 'number' ? n.size : 0 }))
              .filter((n) => !isDenied(n.path))
              .filter((n) => isAllowed(n.path))
              .filter((n) => n.size === 0 || n.size <= 120_000);

            const score = (p: string) => {
              if (important.includes(p)) return 1000;
              let s = 0;
              if (p.startsWith('app/')) s += 120;
              if (p.startsWith('src/')) s += 110;
              if (p.startsWith('lib/')) s += 105;
              if (p.startsWith('components/')) s += 95;
              if (p.includes('/api/')) s += 90;
              if (p.includes('auth') || p.includes('security')) s += 60;
              if (p.includes('middleware') || p.includes('proxy')) s += 60;
              if (p.includes('route.ts')) s += 50;
              // favor shorter paths a bit
              s += Math.max(0, 50 - p.length / 4);
              return s;
            };

            const picked: string[] = [];
            for (const p of important) {
              if (candidates.find((c) => c.path === p)) picked.push(p);
            }
            for (const c of candidates.sort((a, b) => score(b.path) - score(a.path))) {
              if (picked.length >= maxFiles) break;
              if (!picked.includes(c.path)) picked.push(c.path);
            }

            // Fetch file contents with small concurrency.
            const toFetch = picked.slice(0, maxFiles);
            let totalChars = 0;
            const concurrency = 4;
            for (let i = 0; i < toFetch.length; i += concurrency) {
              const batch = toFetch.slice(i, i + concurrency);
              const results = await Promise.all(
                batch.map(async (p) => {
                  const text = await fetchTextFileFromContents(p, defaultBranch || undefined);
                  return { path: p, text };
                })
              );
              for (const r of results) {
                if (!r.text) continue;
                if (totalChars >= totalCharBudget) break;
                const remaining = totalCharBudget - totalChars;
                const sliceLen = Math.min(perFileCharLimit, remaining);
                const content = r.text.slice(0, sliceLen);
                files.push({ path: r.path, content, truncated: r.text.length > sliceLen });
                totalChars += content.length;
              }
              if (totalChars >= totalCharBudget) break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch repo files for code analysis:', e);
    }

    return {
      repoName: `${owner}/${repo}`,
      readme: readme || 'No README found',
      dependencies,
      techStack: techStack.length > 0 ? techStack : ['JavaScript', 'Node.js'],
      files,
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
      files: [
        { path: 'README.md', content: '# Demo Repository\n\nThis is a demo repository for testing purposes.' },
        { path: 'package.json', content: '{ "name": "demo", "dependencies": { "react": "^18.0.0" } }' },
      ],
      stats: {
        stars: 42,
        contributors: 5,
        lastUpdate: new Date().toISOString(),
      },
    };
  }
}

