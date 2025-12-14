'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  DollarSign,
  Calendar,
  Sparkles,
  Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getMockProposal } from '@/lib/mock-data';

interface Proposal {
  id: string;
  clientName: string;
  repoUrl: string;
  analysis: {
    techStack: string[];
    issues: Array<{
      id: string;
      title: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      impact: string;
      recommendedService: string;
    }>;
    opportunities: Array<{
      title: string;
      description: string;
      recommendedService: string;
    }>;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    timeline: string;
    included: string[];
  }>;
  generatedAt: string;
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
        let parsed: any = null;
        if (responseText) {
          try {
            parsed = JSON.parse(responseText);
          } catch {
            parsed = null;
          }
        }

        if (!response.ok) {
          const errorData = parsed && typeof parsed === 'object' ? parsed : { error: 'Non-JSON error response', body: responseText?.slice(0, 200) };
          const errorMessage =
            errorData?.error ||
            errorData?.message ||
            `HTTP ${response.status}: ${response.statusText}`;

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
        const data = parsed && typeof parsed === 'object' ? parsed : (() => {
          throw new Error(`Expected JSON proposal but got: ${contentType || 'unknown content-type'} (${responseText?.slice(0, 200)})`);
        })();

        console.log('Proposal fetched successfully:', data.id);
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        setProposal(data);
        
        // Mark as fetched AFTER successful fetch
        hasFetchedRef.current = id;
        
        // Auto-select services recommended by critical issues (only once per proposal)
        if (data.analysis?.issues && !hasAutoSelectedRef.current) {
          const criticalIssues = data.analysis.issues.filter(
            (issue: any) => issue.severity === 'critical'
          );
          const autoSelected = new Set<string>(
            criticalIssues.map((issue: any) => issue.recommendedService).filter(Boolean)
          );
          if (autoSelected.size > 0) {
            setSelectedServices(autoSelected);
            hasAutoSelectedRef.current = true;
          }
        }
        
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error fetching proposal:', error);
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        alert(`Failed to load proposal: ${error.message || 'Unknown error'}\n\nRedirecting to home...`);
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
      let data: any = {};
      
      // Try to parse as JSON
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', responseText);
          alert(`Checkout failed: ${response.status} ${response.statusText}\n\nResponse: ${responseText.substring(0, 200)}`);
          setIsSubmitting(false);
          return;
        }
      }

      if (!response.ok) {
        // Show detailed error message
        const errorMessage = data.error || data.message || `Failed to create checkout session (${response.status})`;
        const details = data.details || data.errorDetails?.message ? `\n\nDetails: ${data.details || data.errorDetails?.message}` : '';
        const warning = data.warning ? `\n\nNote: ${data.warning}` : '';
        
        console.error('Checkout API error:', {
          status: response.status,
          statusText: response.statusText,
          responseText: responseText,
          parsedData: data,
        });
        alert(`${errorMessage}${details}${warning}`);
        
        // If there's a fallback checkout URL, use it
        if (data.checkoutUrl) {
          router.push(data.checkoutUrl);
        }
        setIsSubmitting(false);
        return;
      }
      
      // Handle multi-session responses (e.g. product checkout per service)
      if (Array.isArray(data.checkoutSessions) && data.checkoutSessions.length > 0) {
        const firstCheckout = data.checkoutSessions[0];
        console.log('Multiple checkout sessions created:', data.checkoutSessions);
        
        if (firstCheckout.checkoutUrl) {
          if (firstCheckout.checkoutUrl.startsWith('http://') || firstCheckout.checkoutUrl.startsWith('https://')) {
            window.location.href = firstCheckout.checkoutUrl;
          } else {
            router.push(firstCheckout.checkoutUrl);
          }
        } else {
          throw new Error('No checkout URL in first session');
        }
      } else if (data.checkoutUrl) {
        // Combined checkout - single URL for all services
        // Check if it's a full URL (Flowglad) or relative path (demo mode)
        if (data.checkoutUrl.startsWith('http://') || data.checkoutUrl.startsWith('https://')) {
          // Flowglad checkout - redirect to external URL
          window.location.href = data.checkoutUrl;
        } else {
          // Demo mode - use internal routing
          router.push(data.checkoutUrl);
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`Failed to proceed to checkout: ${error.message || 'Unknown error'}. Please check the console for details.`);
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

  const criticalIssues = proposal.analysis.issues.filter((i) => i.severity === 'critical');
  const highIssues = proposal.analysis.issues.filter((i) => i.severity === 'high');
  const mediumIssues = proposal.analysis.issues.filter((i) => i.severity === 'medium');
  const lowIssues = proposal.analysis.issues.filter((i) => i.severity === 'low');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

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
          <div className="lg:col-span-2 space-y-6">
            {/* Executive Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    Our AI analysis of <strong>{proposal.repoUrl}</strong> has identified{' '}
                    <strong>{proposal.analysis.issues.length} issues</strong> and{' '}
                    <strong>{proposal.analysis.opportunities.length} opportunities</strong>{' '}
                    for improvement. The analysis reveals a tech stack built on{' '}
                    <strong>{proposal.analysis.techStack.join(', ')}</strong> with several
                    areas requiring immediate attention to ensure security, performance, and scalability.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {proposal.analysis.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Critical Issues */}
            {criticalIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Critical Issues Found ({criticalIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {criticalIssues.map((issue, idx) => {
                      const service = proposal.services.find(
                        (s) => s.id === issue.recommendedService
                      );
                      return (
                        <div
                          key={issue.id}
                          className="p-4 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span>{getSeverityIcon(issue.severity)}</span>
                                <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                                <Badge variant={getSeverityColor(issue.severity) as any}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-gray-700 mb-2">{issue.description}</p>
                              <p className="text-sm text-gray-600">
                                <strong>Impact:</strong> {issue.impact}
                              </p>
                            </div>
                          </div>
                          {service && (
                            <div className="mt-4 pt-4 border-t border-red-200">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                  checked={selectedServices.has(service.id)}
                                  onChange={() => toggleService(service.id)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">{service.name}</p>
                                      <p className="text-sm text-gray-600">{service.description}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg text-gray-900">
                                        ${service.price.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {service.timeline}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* High Priority Issues */}
            {highIssues.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-lg border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-5 h-5" />
                      High Priority Issues ({highIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {highIssues.map((issue) => {
                      const service = proposal.services.find(
                        (s) => s.id === issue.recommendedService
                      );
                      return (
                        <div
                          key={issue.id}
                          className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span>{getSeverityIcon(issue.severity)}</span>
                                <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                                <Badge variant={getSeverityColor(issue.severity) as any}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="text-gray-700 mb-2">{issue.description}</p>
                              <p className="text-sm text-gray-600">
                                <strong>Impact:</strong> {issue.impact}
                              </p>
                            </div>
                          </div>
                          {service && (
                            <div className="mt-4 pt-4 border-t border-orange-200">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                  checked={selectedServices.has(service.id)}
                                  onChange={() => toggleService(service.id)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">{service.name}</p>
                                      <p className="text-sm text-gray-600">{service.description}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg text-gray-900">
                                        ${service.price.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {service.timeline}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Medium & Low Issues */}
            {(mediumIssues.length > 0 || lowIssues.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Other Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[...mediumIssues, ...lowIssues].map((issue) => (
                      <div key={issue.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{getSeverityIcon(issue.severity)}</span>
                          <h4 className="font-medium text-gray-900">{issue.title}</h4>
                          <Badge variant={getSeverityColor(issue.severity) as any}>
                            {issue.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{issue.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Opportunities */}
            {proposal.analysis.opportunities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <Lightbulb className="w-5 h-5" />
                      Opportunities ({proposal.analysis.opportunities.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {proposal.analysis.opportunities.map((opp) => {
                      const service = proposal.services.find(
                        (s) => s.id === opp.recommendedService
                      );
                      return (
                        <div
                          key={opp.title}
                          className="p-4 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Lightbulb className="w-5 h-5 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{opp.title}</h3>
                              <p className="text-gray-700">{opp.description}</p>
                            </div>
                          </div>
                          {service && (
                            <div className="mt-4 pt-4 border-t border-green-200">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <Checkbox
                                  checked={selectedServices.has(service.id)}
                                  onChange={() => toggleService(service.id)}
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-gray-900">{service.name}</p>
                                      <p className="text-sm text-gray-600">{service.description}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-lg text-gray-900">
                                        ${service.price.toLocaleString()}
                                      </p>
                                      <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {service.timeline}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            )}
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

