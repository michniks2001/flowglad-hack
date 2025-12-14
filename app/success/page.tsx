'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail, Calendar, ArrowRight, Home, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposalId');
  const invoiceId = searchParams.get('invoiceId');
  const amount = searchParams.get('amount');
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    if (proposalId) {
      fetch(`/api/proposal/${proposalId}`)
        .then((res) => res.json())
        .then((data) => setProposal(data))
        .catch(console.error);
    }
  }, [proposalId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0">
          <CardContent className="p-12 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Successful! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Thank you for your purchase
            </p>
            {amount && (
              <p className="text-2xl font-bold text-indigo-600 mb-4">
                ${parseInt(amount).toLocaleString()}
              </p>
            )}
            {invoiceId && (
              <p className="text-sm text-gray-500 mb-8">
                Invoice ID: {invoiceId}
              </p>
            )}

            {/* What's Next */}
            <div className="bg-indigo-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                What Happens Next?
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    You'll receive a confirmation email with all the details of your purchase
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Our team will reach out within 24 hours to schedule a kickoff meeting
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    We'll begin working on your selected services according to the agreed timeline
                  </span>
                </li>
              </ul>
            </div>

            {/* Email Notice */}
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-8">
              <Mail className="w-5 h-5" />
              <p className="text-sm">
                A detailed invoice and receipt has been sent to your email address
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
              {proposalId && (
                <Button
                  onClick={() => router.push(`/proposal/${proposalId}`)}
                  className="flex items-center gap-2"
                >
                  View Proposal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

