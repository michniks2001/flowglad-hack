'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Globe, LogIn } from 'lucide-react';

export default function Home() {
  const { user, isLoading: authLoading } = useUser();
  const [githubUrl, setGithubUrl] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent, isDemo = false) => {
    e.preventDefault();
    
    // If not authenticated, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      if (isDemo) {
        // Demo mode - skip API call and use mock data
        router.push('/proposal/demo');
        return;
      }

      // For authenticated users, create a consulting request instead
      if (user) {
        const response = await fetch('/api/consulting-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectUrl: githubUrl }),
        });

        if (!response.ok) {
          throw new Error('Failed to create consulting request');
        }

        const { request } = await response.json();
        router.push('/dashboard');
        return;
      }

      // Fallback for non-authenticated (shouldn't reach here)
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ githubUrl, consultantEmail }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze repository');
      }

      const { proposalId } = await response.json();
      router.push(`/analyze?proposalId=${proposalId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process request. Please try again or use demo mode.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
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
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Consulting Proposal Generator
          </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Transform any GitHub repository or website into a personalized consulting proposal
            with AI-powered analysis and interactive pricing.
          </p>
          <p className="text-gray-500">
            Enter a GitHub repository URL or website URL and watch AI identify issues, opportunities, and generate a custom proposal
          </p>
        </div>

        {/* Main Form Card */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Provide a GitHub repository URL or any website URL to analyze
            </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                <div>
                  <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="inline w-4 h-4 mr-2" />
                    GitHub Repository URL or Website URL
                  </label>
                  <input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo or https://example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Enter a GitHub repository URL or any website URL to analyze
                  </p>
                </div>

                <div>
                  <label htmlFor="consultantEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Consultant Email (Optional)
                  </label>
                  <input
                    id="consultantEmail"
                    type="email"
                    value={consultantEmail}
                    onChange={(e) => setConsultantEmail(e.target.value)}
                    placeholder="consultant@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base"
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/login')}
                      className="w-full"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={(e) => handleSubmit(e, true)}
                    className="w-full text-sm"
                  >
                    Try Demo Mode (No Login Required)
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">AI-Powered Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Advanced AI identifies security issues, performance bottlenecks, and opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Custom Proposals</h3>
                <p className="text-gray-600 text-sm">
                  Each proposal is uniquely generated based on the repository analysis
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <ArrowRight className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Instant Checkout</h3>
                <p className="text-gray-600 text-sm">
                  Seamless payment integration with Flowglad for immediate service activation
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
