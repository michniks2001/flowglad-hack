'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, Loader2 } from 'lucide-react';

export default function RoleSelectPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'consultant' | 'business' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleRoleSelect = async (role: 'consultant' | 'business') => {
    setSelectedRole(role);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to set role');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error setting role:', error);
      alert('Failed to set role. Please try again.');
      setIsSubmitting(false);
      setSelectedRole(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Choose Your Role</CardTitle>
          <CardDescription>
            Select how you'll use the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Consultant Option */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === 'consultant' ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
              }`}
              onClick={() => !isSubmitting && handleRoleSelect('consultant')}
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                  <Briefcase className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Consultant</h3>
                <p className="text-gray-600 text-sm mb-4">
                  View consulting requests and generate proposals for businesses
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-2 mb-4">
                  <li>• View incoming requests</li>
                  <li>• Generate AI-powered proposals</li>
                  <li>• Manage your consulting projects</li>
                </ul>
                {isSubmitting && selectedRole === 'consultant' && (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
                )}
              </CardContent>
            </Card>

            {/* Business Option */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === 'business' ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''
              }`}
              onClick={() => !isSubmitting && handleRoleSelect('business')}
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Business</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Create consulting requests and view proposals
                </p>
                <ul className="text-left text-sm text-gray-500 space-y-2 mb-4">
                  <li>• Submit project for analysis</li>
                  <li>• Receive AI-generated proposals</li>
                  <li>• Purchase consulting services</li>
                </ul>
                {isSubmitting && selectedRole === 'business' && (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

