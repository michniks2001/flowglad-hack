export interface WebsiteData {
  url: string;
  title: string;
  description: string;
  content: string;
  techStack: string[];
  metaTags: Record<string, string>;
}

/**
 * Detects if a URL is a GitHub URL or a regular website
 */
export function isGitHubUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'github.com' || urlObj.hostname === 'www.github.com';
  } catch {
    return false;
  }
}

/**
 * Analyzes a website by fetching its HTML and extracting relevant information
 */
export async function analyzeWebsite(websiteUrl: string): Promise<WebsiteData> {
  try {
    // Ensure URL has protocol
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    console.log('Fetching website:', url);

    // Fetch the website HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProposalGenerator/1.0; +https://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Website HTML fetched, length:', html.length);

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Website';

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';

    // Extract meta tags
    const metaTags: Record<string, string> = {};
    const metaMatches = html.matchAll(/<meta[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']+)["']/gi);
    for (const match of metaMatches) {
      metaTags[match[1].toLowerCase()] = match[2];
    }

    // Extract text content (remove scripts, styles, etc.)
    let textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000); // Limit to 5000 characters

    // Detect tech stack from HTML
    const techStack: string[] = [];

    // Detect React
    if (html.includes('react') || html.includes('React') || html.includes('__REACT_DEVTOOLS')) {
      techStack.push('React');
    }

    // Detect Next.js
    if (html.includes('__NEXT_DATA__') || html.includes('_next/static')) {
      techStack.push('Next.js');
    }

    // Detect Vue
    if (html.includes('vue') || html.includes('Vue') || html.includes('__VUE__')) {
      techStack.push('Vue.js');
    }

    // Detect Angular
    if (html.includes('ng-') || html.includes('angular') || html.includes('Angular')) {
      techStack.push('Angular');
    }

    // Detect WordPress
    if (html.includes('wp-content') || html.includes('wordpress') || html.includes('WordPress')) {
      techStack.push('WordPress');
    }

    // Detect Shopify
    if (html.includes('shopify') || html.includes('Shopify')) {
      techStack.push('Shopify');
    }

    // Detect from meta tags
    if (metaTags['generator']) {
      const generator = metaTags['generator'].toLowerCase();
      if (generator.includes('wordpress')) techStack.push('WordPress');
      if (generator.includes('drupal')) techStack.push('Drupal');
      if (generator.includes('joomla')) techStack.push('Joomla');
    }

    // Detect from script sources
    if (html.includes('jquery')) techStack.push('jQuery');
    if (html.includes('bootstrap')) techStack.push('Bootstrap');
    if (html.includes('tailwind')) techStack.push('Tailwind CSS');

    // Default to web technologies if nothing detected
    if (techStack.length === 0) {
      techStack.push('HTML', 'CSS', 'JavaScript');
    }

    return {
      url: websiteUrl,
      title,
      description,
      content: `${title}\n\n${description}\n\n${textContent}`,
      techStack: [...new Set(techStack)], // Remove duplicates
      metaTags,
    };
  } catch (error: any) {
    console.error('Website analysis error:', error);
    
    // Return fallback data
    return {
      url: websiteUrl,
      title: 'Website Analysis',
      description: 'Unable to fetch website content',
      content: `Analysis of ${websiteUrl}\n\nUnable to fetch full website content. This could be due to:\n- Website blocking automated requests\n- Network issues\n- Invalid URL\n\nPlease ensure the website is publicly accessible.`,
      techStack: ['Web'],
      metaTags: {},
    };
  }
}

