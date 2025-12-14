'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react';

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposalId');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const progressRef = useRef(0);
  const hasShownMissingProposalAlertRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const steps = [
    { label: 'Fetching repository data...', icon: '📥' },
    { label: 'Analyzing tech stack...', icon: '🔍' },
    { label: 'Identifying issues and opportunities...', icon: '⚡' },
    { label: 'Generating custom proposal...', icon: '✨' },
  ];

  useEffect(() => {
    if (!proposalId) {
      router.push('/');
      return;
    }

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 2;
        if (newProgress >= 100) {
          clearInterval(interval);
          // Update current step
          setCurrentStep(steps.length - 1);
          // Redirect to proposal page
          setTimeout(() => {
            router.push(`/proposal/${proposalId}`);
          }, 500);
          return 100;
        }
        // Update current step based on progress
        const newStep = Math.floor((newProgress / 100) * steps.length);
        setCurrentStep(Math.min(newStep, steps.length - 1));
        return newProgress;
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [proposalId, router]);

  // Check if proposal is ready
  useEffect(() => {
    if (!proposalId) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const stop = () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
      interval = null;
      timeout = null;
    };

    const checkProposal = async () => {
      // Only start polling once we're far enough along in the UI progress
      if (progressRef.current <= 50) return;
      if (cancelled) return;

      try {
        const response = await fetch(`/api/proposal/${proposalId}`);

        if (response.status === 404) {
          // In-memory store was likely reset; don't hammer the API.
          stop();
          if (!hasShownMissingProposalAlertRef.current) {
            hasShownMissingProposalAlertRef.current = true;
            alert(
              'Proposal not found.\n\nThis usually means the server restarted and in-memory proposals were cleared.\n\nPlease re-run analysis from the home page.'
            );
          }
          router.push('/');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.id) {
            stop();
            setProgress(100);
            setTimeout(() => {
              router.push(`/proposal/${proposalId}`);
            }, 500);
          }
          return;
        }

        // Non-404, non-OK: treat as "not ready yet"
        console.log('Proposal not ready yet, will retry...');
      } catch (error) {
        console.error('Error checking proposal:', error);
      }
    };

    // Poll every 2 seconds (gated by progressRef)
    interval = setInterval(checkProposal, 2000);
    // Also check once quickly (but gated)
    checkProposal();

    // After 10 seconds, stop polling and (if we're basically done) navigate anyway
    timeout = setTimeout(() => {
      stop();
      if (progressRef.current >= 90) {
        router.push(`/proposal/${proposalId}`);
      }
    }, 10000);

    return () => {
      cancelled = true;
      stop();
    };
  }, [proposalId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-0">
        <CardContent className="p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analyzing Repository
            </h1>
            <p className="text-gray-600">
              Our AI is examining your codebase and generating insights...
            </p>
          </div>

          <div className="space-y-6">
            <Progress value={progress} className="h-3" />

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    index <= currentStep
                      ? 'bg-indigo-50 border-2 border-indigo-200'
                      : 'bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {index < currentStep ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : index === currentStep ? (
                      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{step.icon} {step.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {progress >= 100 && (
              <div className="text-center pt-4">
                <p className="text-green-600 font-medium">
                  ✓ Analysis complete! Redirecting to proposal...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AnalyzeContent />
    </Suspense>
  );
}

