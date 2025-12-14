'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

function CheckoutContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = params.proposalId as string;
  const servicesParam = searchParams.get('services') || '';
  // IMPORTANT: memoize derived array so it doesn't change identity every render
  const serviceIds = useMemo(
    () => servicesParam.split(',').map((s) => s.trim()).filter(Boolean),
    [servicesParam]
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Fetch proposal to get service details
    const fetchServices = async () => {
      try {
        const response = await fetch(`/api/proposal/${proposalId}`);
        if (response.ok) {
          const proposal = await response.json();
          const selectedServices = proposal.services.filter((s: any) =>
            serviceIds.includes(s.id)
          );
          setServices(selectedServices);
          setTotal(
            selectedServices.reduce((sum: number, s: any) => sum + s.price, 0)
          );
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    if (proposalId && serviceIds.length > 0) {
      fetchServices();
    }
  }, [proposalId, servicesParam]); // depend on the stable string, not the array

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    // In production, this would integrate with Flowglad
    setTimeout(() => {
      router.push(`/success?proposalId=${proposalId}&amount=${total}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-xl border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  Checkout
                </CardTitle>
                <CardDescription>Review your selected services</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Services Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Selected Services</h3>
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{service.timeline}</p>
                    </div>
                    <p className="font-semibold text-lg text-gray-900">
                      ${service.price.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-gray-900">Total Amount</span>
              <span className="text-3xl font-bold text-indigo-600">
                ${total.toLocaleString()}
              </span>
            </div>

            {/* Payment Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This is a demo checkout. In production, this would
                integrate with Flowglad for secure payment processing.
              </p>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={isProcessing || services.length === 0}
              className="w-full h-12 text-base"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Complete Payment
                </>
              )}
            </Button>

            {/* Security Notice */}
            <p className="text-xs text-center text-gray-500">
              🔒 Your payment information is secure and encrypted
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

