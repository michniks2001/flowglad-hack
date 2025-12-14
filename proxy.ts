import { auth0 } from './lib/auth0';

// Auth0 v4 for Next.js 16: Use proxy.ts instead of middleware.ts
// This handles ALL routes including /api/auth/* (configured in lib/auth0.ts)
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

