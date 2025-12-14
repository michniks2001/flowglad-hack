'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'consultant' ? 'Consultant' : 'Business'} Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/api/auth/logout'}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        {userRole === 'consultant' ? (
          <ConsultantDashboard />
        ) : (
          <BusinessDashboard />
        )}
      </main>
    </div>
  );
}

