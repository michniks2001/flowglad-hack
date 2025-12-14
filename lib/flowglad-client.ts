import { FlowgladServer } from '@flowglad/server';

function getFlowgladApiKey() {
  // Support both names:
  // - FLOWGLAD_SECRET_KEY: what the Flowglad SDK expects by default
  // - FLOWGLAD_API_KEY: what we previously used for direct REST calls
  return process.env.FLOWGLAD_SECRET_KEY || process.env.FLOWGLAD_API_KEY || '';
}

function isLikelyNetworkError(err: any) {
  const msg = String(err?.message || err || '');
  const code = err?.cause?.code || err?.code;
  return (
    code === 'EAI_AGAIN' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    msg.toLowerCase().includes('fetch failed') ||
    msg.toLowerCase().includes('getaddrinfo')
  );
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts?: { retries?: number; timeoutMs?: number; baseDelayMs?: number }
) {
  const retries = opts?.retries ?? 2;
  const timeoutMs = opts?.timeoutMs ?? 15_000;
  const baseDelayMs = opts?.baseDelayMs ?? 400;

  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, init, timeoutMs);
    } catch (err: any) {
      lastErr = err;
      if (!isLikelyNetworkError(err) || attempt === retries) {
        throw err;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`[flowglad] network error calling ${url} (attempt ${attempt + 1}/${retries + 1}); retrying in ${delay}ms`, {
        code: err?.cause?.code || err?.code,
        message: err?.message,
      });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// Create a Flowglad server instance factory
export function createFlowgladServer(customerExternalId: string, email?: string, name?: string) {
  const apiKey = getFlowgladApiKey();
  return new FlowgladServer({
    customerExternalId,
    // Pass apiKey explicitly so the SDK doesn't depend on FLOWGLAD_SECRET_KEY env var.
    apiKey,
    getCustomerDetails: async () => {
      return {
        email: email || `customer-${customerExternalId}@example.com`,
        name: name || `Customer ${customerExternalId}`,
      };
    },
  });
}

// Create a product checkout session (no invoices).
// NOTE: Requires you to have a Flowglad Price configured already (priceId or priceSlug).
export async function createProductCheckoutSession(options: {
  customerExternalId: string;
  customerEmail?: string;
  customerName?: string;
  priceId?: string;
  priceSlug?: string;
  quantity?: number;
  successUrl: string;
  cancelUrl: string;
  outputName?: string;
  outputMetadata?: Record<string, string>;
}) {
  const apiKey = getFlowgladApiKey();
  if (!apiKey) {
    throw new Error('Flowglad API key not configured (set FLOWGLAD_SECRET_KEY or FLOWGLAD_API_KEY)');
  }
  if (!options.priceId && !options.priceSlug) {
    throw new Error('Missing priceId/priceSlug for product checkout session');
  }

  const flowglad = createFlowgladServer(
    options.customerExternalId,
    options.customerEmail,
    options.customerName
  );

  await flowglad.findOrCreateCustomer();

  // Flowglad docs: createCheckoutSession supports priceId or priceSlug,
  // successUrl, cancelUrl, quantity, and optionally outputMetadata/outputName.
  const result = await flowglad.createCheckoutSession({
    ...(options.priceId ? { priceId: options.priceId } : {}),
    ...(options.priceSlug ? { priceSlug: options.priceSlug } : {}),
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
    quantity: options.quantity ?? 1,
    ...(options.outputMetadata ? { outputMetadata: options.outputMetadata } : {}),
    ...(options.outputName ? { outputName: options.outputName } : {}),
  } as any);

  const checkoutSession = (result as any)?.checkoutSession ?? result;

  const checkoutUrl =
    // common fields
    (checkoutSession as any)?.url ||
    (checkoutSession as any)?.checkoutUrl ||
    (checkoutSession as any)?.checkout_url ||
    (checkoutSession as any)?.hostedUrl ||
    (checkoutSession as any)?.hosted_url ||
    (checkoutSession as any)?.redirectUrl ||
    (checkoutSession as any)?.redirect_url ||
    // sometimes nested
    (checkoutSession as any)?.checkoutSession?.url ||
    (checkoutSession as any)?.checkoutSession?.checkoutUrl ||
    (checkoutSession as any)?.checkoutSession?.checkout_url ||
    // sometimes returned at top-level
    (result as any)?.url ||
    (result as any)?.checkoutUrl ||
    (result as any)?.checkout_url;

  if (!checkoutUrl) {
    console.error('[flowglad] createCheckoutSession returned no URL', {
      resultKeys: result && typeof result === 'object' ? Object.keys(result as any) : typeof result,
      checkoutSessionKeys:
        checkoutSession && typeof checkoutSession === 'object'
          ? Object.keys(checkoutSession as any)
          : typeof checkoutSession,
      resultPreview: (() => {
        try {
          return JSON.stringify(result).slice(0, 2000);
        } catch {
          return String(result);
        }
      })(),
    });
    throw new Error('Product checkout session created but no URL returned (unexpected Flowglad response shape)');
  }

  return { checkoutSession, checkoutUrl };
}

// Create a dynamic checkout session for a single item/service
export async function createDynamicCheckoutSession(
  customerExternalId: string,
  item: {
    id: string;
    name: string;
    description: string;
    price: number; // in cents
    quantity?: number;
  },
  metadata: Record<string, string>,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const apiKey = getFlowgladApiKey();
    if (!apiKey) {
      throw new Error('Flowglad API key not configured (set FLOWGLAD_SECRET_KEY or FLOWGLAD_API_KEY)');
    }

    // Ensure customer exists
    const flowglad = createFlowgladServer(
      customerExternalId,
      metadata.customerEmail,
      metadata.customerName
    );
    await flowglad.findOrCreateCustomer();

    // Create invoice for this single item
    const invoicePayload = {
      customerExternalId,
      lineItems: [
        {
          description: `${item.name} - ${item.description}`,
          quantity: item.quantity || 1,
          price: item.price, // Price in cents
        },
      ],
      metadata: {
        ...metadata,
        itemId: item.id,
        itemName: item.name,
      },
      status: 'open',
    };

    console.log('Creating dynamic invoice with payload:', JSON.stringify(invoicePayload, null, 2));

    const invoiceResponse = await fetchWithRetry('https://api.flowglad.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create invoice' };
      }
      throw new Error(errorData.message || errorData.error || `Failed to create invoice: ${invoiceResponse.status}`);
    }

    const invoice = await invoiceResponse.json();
    console.log('Dynamic invoice created:', invoice.id);

    // Create checkout session for the invoice
    const checkoutPayload = {
      customerExternalId,
      invoiceId: invoice.id,
      successUrl,
      cancelUrl,
      type: 'invoice',
    };

    console.log('Creating dynamic checkout session with payload:', JSON.stringify(checkoutPayload, null, 2));

    const checkoutResponse = await fetchWithRetry('https://api.flowglad.com/v1/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutResponse.ok) {
      const errorText = await checkoutResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create checkout session' };
      }
      throw new Error(errorData.message || errorData.error || `Failed to create checkout session: ${checkoutResponse.status}`);
    }

    const checkoutData = await checkoutResponse.json();
    const checkoutUrl = checkoutData.url || 
                        checkoutData.checkoutUrl || 
                        checkoutData.checkoutSession?.url ||
                        checkoutData.checkoutSession?.checkoutUrl;

    if (!checkoutUrl) {
      throw new Error('Checkout session created but no URL returned');
    }

    return {
      checkoutUrl,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber || invoice.invoice_number,
      itemId: item.id,
      itemName: item.name,
      price: item.price,
    };
  } catch (error: any) {
    console.error('Dynamic checkout session error:', error);
    throw error;
  }
}

// Create an invoice with line items for selected services using REST API
export async function createInvoice(
  customerExternalId: string,
  lineItems: Array<{
    description: string;
    quantity: number;
    price: number; // in cents
  }>,
  metadata?: Record<string, string>
) {
  try {
    const apiKey = getFlowgladApiKey();
    if (!apiKey) {
      throw new Error('Flowglad API key not configured (set FLOWGLAD_SECRET_KEY or FLOWGLAD_API_KEY)');
    }

    // First ensure customer exists using the SDK
    const flowglad = createFlowgladServer(
      customerExternalId,
      metadata?.customerEmail,
      metadata?.customerName
    );
    await flowglad.findOrCreateCustomer();

    // Create invoice via REST API
    // Flowglad API endpoint for creating invoices
    const invoicePayload = {
      customerExternalId,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        price: item.price, // Price in cents
      })),
      metadata: metadata || {},
      status: 'open', // Invoice is open and awaiting payment
    };

    console.log('Creating Flowglad invoice with payload:', JSON.stringify(invoicePayload, null, 2));

    const response = await fetchWithRetry('https://api.flowglad.com/v1/invoices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create invoice' };
      }
      
      console.error('Flowglad invoice creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      
      throw new Error(errorData.message || errorData.error || `Failed to create invoice: ${response.status} ${response.statusText}`);
    }

    const invoiceData = await response.json();
    console.log('Invoice created successfully:', invoiceData.id);
    return invoiceData;
  } catch (error: any) {
    console.error('Flowglad invoice creation error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Failed to create invoice: ${error.message || 'Unknown error'}`);
  }
}

// Create a checkout session for an invoice using REST API
export async function createInvoiceCheckoutSession(
  customerExternalId: string,
  invoiceId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    const apiKey = getFlowgladApiKey();
    if (!apiKey) {
      throw new Error('Flowglad API key not configured (set FLOWGLAD_SECRET_KEY or FLOWGLAD_API_KEY)');
    }

    // Create invoice checkout session via REST API
    // Flowglad API endpoint for creating checkout sessions
    const checkoutPayload = {
      customerExternalId,
      invoiceId,
      successUrl,
      cancelUrl,
      type: 'invoice', // Invoice checkout session type
    };

    console.log('Creating Flowglad checkout session with payload:', JSON.stringify(checkoutPayload, null, 2));

    const response = await fetchWithRetry('https://api.flowglad.com/v1/checkout-sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Failed to create checkout session' };
      }
      
      console.error('Flowglad checkout session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        requestBody: {
          customerExternalId,
          invoiceId,
          successUrl,
          cancelUrl,
        },
      });
      
      throw new Error(errorData.message || errorData.error || `Failed to create checkout session: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Checkout session created successfully:', {
      id: data.id || data.checkoutSession?.id,
      url: data.url || data.checkoutUrl || data.checkoutSession?.url || data.checkoutSession?.checkoutUrl,
      fullResponse: data,
    });
    
    // Return data with normalized structure
    return {
      ...data,
      url: data.url || data.checkoutUrl || data.checkoutSession?.url || data.checkoutSession?.checkoutUrl,
      checkoutUrl: data.url || data.checkoutUrl || data.checkoutSession?.url || data.checkoutSession?.checkoutUrl,
    };
  } catch (error: any) {
    console.error('Flowglad checkout session error:', error);
    if (error.message) {
      throw error;
    }
    throw new Error(`Failed to create checkout session: ${error.message || 'Unknown error'}`);
  }
}

