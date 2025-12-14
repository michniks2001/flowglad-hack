import { NextResponse } from 'next/server';
import { getProposalAsync } from '@/lib/store';
import { SERVICES } from '@/lib/flowglad';
import { createProductCheckoutSession } from '@/lib/flowglad-client';
import { getPriceSlugForService } from '@/lib/flowglad-prices';

export async function POST(req: Request) {
  let body: any;
  
  try {
    body = await req.json();
    const { 
      proposalId, 
      selectedServices, 
      customerEmail, 
      customerName,
      // legacy params (ignored; we always create product checkout sessions now)
      createIndividualPayments,
      checkoutMode,
      customMetadata = {}, // Additional metadata to include
    } = body;

    if (!proposalId || !selectedServices || !Array.isArray(selectedServices)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const proposal = await getProposalAsync(proposalId);
    if (!proposal) {
      console.warn(`Proposal ${proposalId} not found in store. This may happen if the server was restarted. Falling back to demo mode.`);
      // Fallback to demo mode if proposal not found (e.g., server restart cleared in-memory store)
      const checkoutUrl = `/checkout/${proposalId}?services=${selectedServices.join(',')}`;
      return NextResponse.json({
        checkoutUrl,
        totalAmount: 0,
        warning: 'Proposal not found in store (server may have restarted). Using demo mode.',
        error: 'Proposal not found',
      });
    }

    // Get selected service details
    const services = selectedServices
      .map((serviceId) => SERVICES[serviceId as keyof typeof SERVICES])
      .filter(Boolean);

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'No valid services selected' },
        { status: 400 }
      );
    }

    // Calculate total
    const totalAmount = services.reduce((sum, service) => sum + service.price, 0);

    // Check if Flowglad is configured
    const flowgladKey = process.env.FLOWGLAD_SECRET_KEY || process.env.FLOWGLAD_API_KEY;
    if (!flowgladKey) {
      // Fallback to demo mode
      const checkoutUrl = `/checkout/${proposalId}?services=${selectedServices.join(',')}`;
      return NextResponse.json({
        checkoutUrl,
        totalAmount,
        warning: 'Flowglad not configured (set FLOWGLAD_SECRET_KEY or FLOWGLAD_API_KEY), using demo mode',
      });
    }

    // Use proposalId as customer external ID (or generate a unique one)
    const customerExternalId = `proposal-${proposalId}`;
    const finalCustomerEmail = customerEmail || `${proposal.clientName.toLowerCase().replace(/\s+/g, '-')}@example.com`;
    const finalCustomerName = customerName || proposal.clientName;
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    // Base metadata for all payments
    const baseMetadata = {
      proposalId,
      repoUrl: proposal.repoUrl,
      clientName: proposal.clientName,
      customerEmail: finalCustomerEmail,
      customerName: finalCustomerName,
      ...customMetadata, // Merge any additional custom metadata
    };

    // --- Product checkout sessions ONLY (no invoices) ---
    // Product checkout sessions only support a single Flowglad Price per session.
    // If multiple services are selected, we create one checkout session per service.
    const sessions: Array<{
      checkoutUrl: string;
      itemId: string;
      itemName: string;
      price: number;
      priceSlug: string;
    }> = [];

    for (const service of services) {
      const priceSlug = getPriceSlugForService(service.id);
      if (!priceSlug) {
        return NextResponse.json(
          {
            error: `Missing Flowglad priceSlug for service "${service.id}"`,
            message:
              'Product checkout sessions require pre-created Flowglad Prices. Configure FLOWGLAD_PRICE_SLUG_* env vars (see README) or FLOWGLAD_PRICE_SLUG_DEFAULT_PREFIX.',
            serviceId: service.id,
          },
          { status: 400 }
        );
      }

      const outputMetadata = {
        ...baseMetadata,
        serviceId: service.id,
        serviceName: service.name,
        serviceDescription: service.description,
        serviceTimeline: service.timeline || '',
      };

      const { checkoutUrl } = await createProductCheckoutSession({
        customerExternalId,
        customerEmail: finalCustomerEmail,
        customerName: finalCustomerName,
        priceSlug,
        quantity: 1,
        successUrl: `${origin}/success?proposalId=${proposalId}&serviceId=${service.id}&amount=${service.price}`,
        cancelUrl: `${origin}/proposal/${proposalId}`,
        outputName: `${service.name} (${proposal.clientName})`,
        outputMetadata,
      });

      sessions.push({
        checkoutUrl,
        itemId: service.id,
        itemName: service.name,
        price: service.price,
        priceSlug,
      });
    }

    if (sessions.length === 1) {
      return NextResponse.json({
        checkoutUrl: sessions[0].checkoutUrl,
        totalAmount,
        type: 'product',
        item: sessions[0],
      });
    }

    return NextResponse.json({
      checkoutSessions: sessions,
      totalAmount,
      type: 'product_individual',
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    const errorCode = error?.cause?.code || error?.code;
    
    // Fallback to mock checkout if Flowglad API fails
    if (body && body.proposalId && body.selectedServices) {
      const checkoutUrl = `/checkout/${body.proposalId}?services=${body.selectedServices.join(',')}`;
      return NextResponse.json({
        checkoutUrl,
        totalAmount: 0,
        warning:
          errorCode === 'EAI_AGAIN' || errorCode === 'ENOTFOUND'
            ? 'Flowglad API unreachable (DNS/network issue). Using demo mode.'
            : 'Flowglad API error, using demo mode',
        error: error.message || error.toString() || 'Unknown error',
        errorDetails: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          code: errorCode,
        },
      });
    }

    return NextResponse.json(
      { 
        error: error.message || error.toString() || 'Failed to create checkout session',
        errorDetails: {
          name: error.name,
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}

