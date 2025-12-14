'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ExternalLink, RefreshCw, Sparkles, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConsultingRequest {
  _id: string;
  businessId: string;
  businessName: string;
  businessEmail: string;
  consultantEmail?: string;
  projectUrl: string;
  projectType: 'github' | 'website';
  status: 'pending' | 'analyzing' | 'proposal_ready' | 'accepted' | 'rejected';
  proposalId?: string;
  consultantId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [requests, setRequests] = useState<ConsultingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectUrl, setProjectUrl] = useState('');
  const [consultantEmail, setConsultantEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/consulting-requests?business=true');
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/consulting-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl,
          consultantEmail,
        }),
      });

      if (response.ok) {
        setProjectUrl('');
        setConsultantEmail('');
        setShowCreateForm(false);
        fetchRequests();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const stats = {
    total: requests.length,
    analyzing: requests.filter((r) => r.status === 'analyzing').length,
    ready: requests.filter((r) => r.status === 'proposal_ready' && r.proposalId).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900">My Requests</h2>
          </div>
          <p className="text-gray-600 mt-2">Create a request, assign a consultant by email, and review proposals.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRequests} variant="black" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="black" onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
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

      {/* Create Request Form */}
      {showCreateForm && (
        <Card className="border-gray-200/70 bg-white/80 backdrop-blur shadow-sm">
          <CardHeader>
            <CardTitle>Create Consulting Request</CardTitle>
            <CardDescription>
              Submit your GitHub repository or website URL, and the consultant email to send it to
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label htmlFor="consultantEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Consultant Email
                </label>
                <input
                  id="consultantEmail"
                  type="email"
                  value={consultantEmail}
                  onChange={(e) => setConsultantEmail(e.target.value)}
                  placeholder="consultant@example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Required. This request will be assigned directly to that consultant.
                </p>
              </div>
              <div>
                <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Project URL
                </label>
                <input
                  id="projectUrl"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://github.com/username/repo or https://example.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Enter a GitHub repository URL or website URL
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="black" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Request'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setProjectUrl('');
                    setConsultantEmail('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : requests.length > 0 ? (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request._id} className="border-gray-200/70 bg-white/70 backdrop-blur">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">Request #{request._id.slice(-8)}</CardTitle>
                    <CardDescription className="truncate">
                      Created {new Date(request.createdAt).toLocaleDateString()}
                      {request.consultantEmail ? ` • Assigned to ${request.consultantEmail}` : ''}
                    </CardDescription>
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
                      className="text-indigo-700 hover:underline flex items-center gap-1 break-all"
                    >
                      {request.projectUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Type:</p>
                    <Badge variant="outline">{request.projectType}</Badge>
                  </div>
                  {request.proposalId && (
                    <div>
                      <Button
                        onClick={() => router.push(`/proposal/${request.proposalId}`)}
                        size="sm"
                        variant="black"
                      >
                        View Proposal <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  {request.status === 'analyzing' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analysis in progress...</span>
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
            <p className="text-gray-600 mb-4">No consulting requests yet</p>
            <Button variant="black" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

