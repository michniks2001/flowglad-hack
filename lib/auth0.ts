import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Configure Auth0 client with custom routes to match /api/auth/* pattern
export const auth0 = new Auth0Client({
  routes: {
    // Use /api/auth/* instead of default /auth/*
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    callback: '/api/auth/callback',
  },
});

