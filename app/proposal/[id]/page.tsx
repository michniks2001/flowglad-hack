'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  DollarSign,
  Sparkles,
  Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getMockProposal } from '@/lib/mock-data';
import { DynamicProposalRenderer } from '@/components/proposal/DynamicProposalRenderer';
import type { Proposal } from '@/lib/types/proposal';

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  // Extract ID directly - params.id should be stable
  const id = (params.id as string) || '';
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewerRole, setViewerRole] = useState<'consultant' | 'business' | null>(null);
  
  // Use refs to track fetch state
  const hasFetchedRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasAutoSelectedRef = useRef(false);

  // Correct mounted-ref pattern (important in React 18 dev/StrictMode where effects mount/cleanup twice)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch viewer role (consultants should not see payment CTAs)
  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        setViewerRole(null);
        return;
      }
      try {
        const res = await fetch('/api/user/sync');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user?.role) {
          setViewerRole(data.user.role);
        }
      } catch {
        // ignore
      }
    };

    if (!authLoading) {
      loadRole();
    }
  }, [user, authLoading]);

  useEffect(() => {
    // Reset auto-select ref when ID changes
    if (hasFetchedRef.current !== id) {
      hasAutoSelectedRef.current = false;
    }

    // Handle missing ID - do this first without state updates
    if (!id) {
      router.push('/');
      return;
    }

    // If proposal is already loaded for this ID, just ensure loading is false
    if (proposal && proposal.id === id) {
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches for the same ID
    if (hasFetchedRef.current === id) {
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    // Mark as fetching BEFORE starting the fetch
    isFetchingRef.current = true;

    const fetchProposal = async () => {
      try {
        if (id === 'demo') {
          // Use mock data for demo
          if (!isMountedRef.current) return;
          const mockProposal = getMockProposal();
          setProposal(mockProposal);
          hasFetchedRef.current = id;
          setIsLoading(false);
          return;
        }

        console.log('[Client ProposalPage] Fetching proposal with ID:', id);
        const response = await fetch(`/api/proposal/${id}`);

        // Read body ONCE, then parse if possible (redirects/middleware can return HTML)
        const responseText = await response.text();
        const contentType = response.headers.get('content-type') || '';
        let parsed: unknown = null;
        if (responseText) {
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = null;
          }
        }

        if (!response.ok) {
          const errorData = asRecord(parsed);
          const errorMessage = (errorData.error as string) || (errorData.message as string) || `HTTP ${response.status}: ${response.statusText}`;

          console.error('Failed to fetch proposal:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            redirected: response.redirected,
            contentType,
            bodySnippet: responseText?.slice(0, 200),
            error: errorData,
          });
          
          // Check if component is still mounted before showing alerts/navigating
          if (!isMountedRef.current) return;
          
          if (response.status === 404) {
            const message = `Proposal not found.\n\nThis could happen if:\n• The proposal ID is invalid\n• The server was restarted (proposals are stored in memory)\n• The proposal expired\n\nError: ${errorMessage}\n\nYou can try:\n• Using demo mode from the home page\n• Creating a new proposal\n\nRedirecting to home...`;
            alert(message);
          } else {
            alert(`Failed to load proposal: ${errorMessage}\n\nRedirecting to home...`);
          }
          
          router.push('/');
          return;
        }
        
        // Success response: prefer parsed JSON, fallback to parsing the text
        const data = (parsed && typeof parsed === 'object' ? parsed : (() => {
          throw new Error(`Expected JSON proposal but got: ${contentType || 'unknown content-type'} (${responseText?.slice(0, 200)})`);
        })()) as Proposal;

        console.log('Proposal fetched successfully:', data.id);
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        setProposal(data);
        
        // Mark as fetched AFTER successful fetch
        hasFetchedRef.current = id;
        
        // Auto-select services recommended by critical issues (only once per proposal)
        if (data.analysis?.issues && !hasAutoSelectedRef.current) {
          const criticalIssues = data.analysis.issues.filter((issue) => issue.severity === 'critical');
          const autoSelected = new Set<string>(
            criticalIssues.map((issue) => issue.recommendedService).filter(Boolean)
          );
          if (autoSelected.size > 0) {
            setSelectedServices(autoSelected);
            hasAutoSelectedRef.current = true;
          }
        }
        
        setIsLoading(false);
      } catch (error: unknown) {
        console.error('Error fetching proposal:', error);
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to load proposal: ${message}\n\nRedirecting to home...`);
        router.push('/');
        setIsLoading(false);
      } finally {
        isFetchingRef.current = false;
        // If we bailed out early (e.g. StrictMode cleanup) but we're still mounted, don't leave UI stuck loading
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchProposal();
    
    // Cleanup function
    return () => {
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only depend on id - proposal check is safe without dependency

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }, []);

  const calculateTotal = () => {
    if (!proposal) return 0;
    return Array.from(selectedServices).reduce((total, serviceId) => {
      const service = proposal.services.find((s) => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const handleCheckout = async () => {
    if (selectedServices.size === 0) {
      alert('Please select at least one service');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: id,
          selectedServices: Array.from(selectedServices),
          customerEmail: proposal?.clientName ? `${proposal.clientName.toLowerCase().replace(/\s+/g, '-')}@example.com` : undefined,
          customerName: proposal?.clientName,
          checkoutMode: 'product', // Use Flowglad product checkout sessions (no invoices)
          customMetadata: {
            // Add any custom metadata here
            // Example: projectType: 'github', analysisDate: new Date().toISOString(),
          },
        }),
      });

      // Read response as text first (can only read once)
      const responseText = await response.text();
      let data: unknown = {};
      
      // Try to parse as JSON
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error('Failed to parse JSON response:', responseText);
          alert(`Checkout failed: ${response.status} ${response.statusText}\n\nResponse: ${responseText.substring(0, 200)}`);
          setIsSubmitting(false);
          return;
        }
      }
      const dataObj = asRecord(data);

      if (!response.ok) {
        // Show detailed error message
        const errorMessage =
          (dataObj.error as string) ||
          (dataObj.message as string) ||
          `Failed to create checkout session (${response.status})`;
        const detailsValue =
          (dataObj.details as string) ||
          (asRecord(dataObj.errorDetails).message as string) ||
          '';
        const details = detailsValue ? `\n\nDetails: ${detailsValue}` : '';
        const warningValue = (dataObj.warning as string) || '';
        const warning = warningValue ? `\n\nNote: ${warningValue}` : '';
        
        console.error('Checkout API error:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText,
          parsedData: dataObj,
        });
        alert(`${errorMessage}${details}${warning}`);
        
        // If there's a fallback checkout URL, use it
        if (typeof dataObj.checkoutUrl === 'string') {
          router.push(dataObj.checkoutUrl);
        }
        setIsSubmitting(false);
        return;
      }
      
      // Handle multi-session responses (e.g. product checkout per service)
      if (Array.isArray(dataObj.checkoutSessions) && dataObj.checkoutSessions.length > 0) {
        const firstCheckout = asRecord(dataObj.checkoutSessions[0]);
        console.log('Multiple checkout sessions created:', dataObj.checkoutSessions);
        
        const checkoutUrl = typeof firstCheckout.checkoutUrl === 'string' ? firstCheckout.checkoutUrl : '';
        if (checkoutUrl) {
          if (checkoutUrl.startsWith('http://') || checkoutUrl.startsWith('https://')) {
            window.location.href = checkoutUrl;
          } else {
            router.push(checkoutUrl);
          }
        } else {
          throw new Error('No checkout URL in first session');
        }
      } else if (typeof dataObj.checkoutUrl === 'string') {
        // Combined checkout - single URL for all services
        // Check if it's a full URL (Flowglad) or relative path (demo mode)
        if (dataObj.checkoutUrl.startsWith('http://') || dataObj.checkoutUrl.startsWith('https://')) {
          // Flowglad checkout - redirect to external URL
          window.location.href = dataObj.checkoutUrl;
        } else {
          // Demo mode - use internal routing
          router.push(dataObj.checkoutUrl);
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to proceed to checkout: ${message}. Please check the console for details.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🎯 Proposal for {proposal.clientName}
              </h1>
              <p className="text-gray-600">
                Generated on {new Date(proposal.generatedAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <DynamicProposalRenderer
                proposal={proposal}
                uiConfig={proposal.uiConfiguration}
                onServiceToggle={toggleService}
                selectedServices={selectedServices}
              />
            </motion.div>
          </div>

          {/* Sidebar - Pricing Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:sticky lg:top-8 h-fit"
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                  Selected Services
                </CardTitle>
                <CardDescription>
                  {selectedServices.size === 0
                    ? 'Select services to see pricing'
                    : `${selectedServices.size} service${selectedServices.size > 1 ? 's' : ''} selected`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedServices.size === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No services selected yet
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {Array.from(selectedServices).map((serviceId) => {
                        const service = proposal.services.find((s) => s.id === serviceId);
                        if (!service) return null;
                        return (
                          <div
                            key={serviceId}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{service.name}</p>
                              <p className="text-xs text-gray-500">{service.timeline}</p>
                            </div>
                            <p className="font-semibold text-gray-900">
                              ${service.price.toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        ${calculateTotal().toLocaleString()}
                      </span>
                    </div>
                    {viewerRole === 'consultant' ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          You&apos;re viewing this as a <strong>consultant</strong>. Share this proposal with the business to collect payment.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 text-base"
                          onClick={async () => {
                            const url = window.location.href;
                            try {
                              await navigator.clipboard.writeText(url);
                              alert('Proposal link copied to clipboard.');
                            } catch {
                              // Fallback: select via prompt
                              window.prompt('Copy proposal link:', url);
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Copy Proposal Link
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleCheckout}
                        disabled={selectedServices.size === 0 || isSubmitting}
                        className="w-full h-12 text-base"
                      >
                        {isSubmitting ? (
                          'Processing...'
                        ) : (
                          <>
                            Proceed to Payment
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

