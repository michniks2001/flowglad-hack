'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // User is logged in, check their role and redirect
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4 mx-auto">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-3xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => window.location.href = '/api/auth/login'}
            className="w-full h-12 text-base"
            size="lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In with Auth0
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            <p>Don't have an account?</p>
            <a
              href="/api/auth/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Sign up here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

