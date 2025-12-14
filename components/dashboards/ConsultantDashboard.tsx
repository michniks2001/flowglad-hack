'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, RefreshCw } from 'lucide-react';

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

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/consulting-requests/${requestId}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh requests
        fetchRequests();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'analyzing':
        return 'default';
      case 'proposal_ready':
        return 'default';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' && !r.consultantId);
  const myRequests = requests.filter(r => r.consultantId === user?.sub);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Consulting Requests</h2>
          <p className="text-gray-600 mt-1">View and manage incoming consulting requests</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Requests</h3>
              <div className="grid gap-4">
                {pendingRequests.map((request) => (
                  <Card key={request._id} className="border-l-4 border-l-indigo-500">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.businessName}</CardTitle>
                          <CardDescription>{request.businessEmail}</CardDescription>
                        </div>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
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
                            className="text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            {request.projectUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Type:</p>
                          <Badge variant="outline">{request.projectType}</Badge>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleAcceptRequest(request._id)}
                            size="sm"
                          >
                            Accept & Generate Proposal
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* My Requests */}
          {myRequests.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">My Requests</h3>
              <div className="grid gap-4">
                {myRequests.map((request) => (
                  <Card key={request._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{request.businessName}</CardTitle>
                          <CardDescription>{request.businessEmail}</CardDescription>
                        </div>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
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
                            className="text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            {request.projectUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {request.proposalId && (
                          <div>
                            <Button
                              onClick={() => window.location.href = `/proposal/${request.proposalId}`}
                              variant="outline"
                              size="sm"
                            >
                              View Proposal
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && myRequests.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No consulting requests available</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

