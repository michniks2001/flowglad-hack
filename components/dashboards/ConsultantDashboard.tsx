'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, RefreshCw, Sparkles, ArrowUpRight } from 'lucide-react';

interface ConsultingRequest {
  _id: string;
  businessId: string;
  businessName: string;
  businessEmail: string;
  projectUrl: string;
  projectType: 'github' | 'website';
  status: 'pending' | 'analyzing' | 'proposal_ready' | 'accepted' | 'rejected';
  proposalId?: string;
  consultantId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConsultantDashboard() {
  const { user } = useUser();
  const [requests, setRequests] = useState<ConsultingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/consulting-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800', label: 'pending' };
      case 'analyzing':
        return { variant: 'secondary' as const, className: 'bg-indigo-50 text-indigo-700', label: 'analyzing' };
      case 'proposal_ready':
        return { variant: 'secondary' as const, className: 'bg-green-50 text-green-700', label: 'proposal ready' };
      case 'accepted':
        return { variant: 'secondary' as const, className: 'bg-blue-50 text-blue-700', label: 'accepted' };
      case 'rejected':
        return { variant: 'destructive' as const, className: '', label: 'rejected' };
      default:
        return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800', label: status.replace('_', ' ') };
    }
  };

  const myRequests = requests.filter((r) => r.consultantId === user?.sub);
  const stats = {
    total: myRequests.length,
    analyzing: myRequests.filter((r) => r.status === 'analyzing').length,
    ready: myRequests.filter((r) => r.status === 'proposal_ready' && r.proposalId).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">Consulting Requests</h2>
          </div>
          <p className="text-gray-600 mt-2">View and manage your assigned consulting requests</p>
        </div>
        <Button onClick={fetchRequests} variant="black" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Analyzing</CardDescription>
            <CardTitle className="text-3xl text-indigo-700">{stats.analyzing}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription>Proposals ready</CardDescription>
            <CardTitle className="text-3xl text-green-700">{stats.ready}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {myRequests.length > 0 ? (
            <div className="grid gap-4">
              {myRequests.map((request) => (
                <Card key={request._id} className="border-gray-200/70 bg-white/70 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <CardTitle className="text-lg">{request.businessName}</CardTitle>
                        <CardDescription className="truncate">{request.businessEmail}</CardDescription>
                      </div>
                      {(() => {
                        const s = getStatusBadge(request.status);
                        return (
                          <Badge variant={s.variant} className={s.className}>
                            {s.label}
                          </Badge>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Project URL:</p>
                        <a
                          href={request.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 break-all"
                        >
                          {request.projectUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700">Type:</p>
                        <Badge variant="outline">{request.projectType}</Badge>
                      </div>

                      {request.status === 'analyzing' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analysis in progress...</span>
                        </div>
                      )}

                      {request.proposalId && (
                        <div className="pt-1">
                          <Button
                            onClick={() => (window.location.href = `/proposal/${request.proposalId}`)}
                            variant="black"
                            size="sm"
                          >
                            View Proposal <ArrowUpRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No consulting requests assigned to you</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

