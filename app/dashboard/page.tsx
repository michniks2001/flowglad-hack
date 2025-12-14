'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConsultantDashboard from '@/components/dashboards/ConsultantDashboard';
import BusinessDashboard from '@/components/dashboards/BusinessDashboard';

export default function DashboardPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'consultant' | 'business' | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/user/sync');
        if (response.ok) {
          const data = await response.json();
          if (data.needsRoleSelection) {
            router.push('/role-select');
            return;
          }
          if (data.user && data.user.role) {
            setUserRole(data.user.role);
          } else {
            // User exists but has no role, redirect to role selection
            router.push('/role-select');
            return;
          }
        } else {
          // If sync fails, try to redirect to role-select as fallback
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error) {
            console.error('User sync error:', errorData.error);
          }
          router.push('/role-select');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // On error, redirect to role-select to allow user to set role
        router.push('/role-select');
      } finally {
        setIsLoadingRole(false);
      }
    };

    if (!isLoading && user) {
      fetchUserRole();
    } else if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || isLoadingRole) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-white">
      {/* subtle background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/55 via-purple-200/45 to-pink-200/35 blur-3xl" />
        <div className="absolute top-[520px] left-[-120px] h-[360px] w-[520px] rounded-full bg-gradient-to-tr from-indigo-200/35 to-cyan-200/25 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200/60 bg-white/70 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-semibold tracking-tight text-gray-900">Flowglad Consulting</span>
            </a>

            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className={userRole === 'consultant' ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'}
              >
                {userRole === 'consultant' ? 'Consultant' : 'Business'}
              </Badge>
              <span className="hidden sm:inline text-sm text-gray-600">{user?.email}</span>
              <Button variant="black" size="sm" onClick={() => (window.location.href = '/api/auth/logout')}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="relative container mx-auto px-4 py-8">
        {userRole === 'consultant' ? (
          <ConsultantDashboard />
        ) : (
          <BusinessDashboard />
        )}
      </main>
    </div>
  );
}

