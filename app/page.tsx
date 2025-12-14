'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SERVICES } from '@/lib/flowglad';
import {
  ArrowRight,
  Check,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Zap,
  Wrench,
  Users,
  BriefcaseBusiness,
  CreditCard,
  FileText,
  BarChart3,
  Globe,
  LogIn,
} from 'lucide-react';

export default function Home() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect authenticated users to dashboard
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const serviceCards = useMemo(() => {
    const serviceList = Object.values(SERVICES);
    // Keep the landing concise: show the core catalog (already what checkout supports).
    return serviceList.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      timeline: s.timeline,
      included: s.included.slice(0, 3),
    }));
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 via-purple-200/50 to-pink-200/40 blur-3xl" />
        <div className="absolute top-[520px] left-[-120px] h-[360px] w-[520px] rounded-full bg-gradient-to-tr from-indigo-200/40 to-cyan-200/30 blur-3xl" />
        <div className="absolute top-[720px] right-[-180px] h-[420px] w-[620px] rounded-full bg-gradient-to-tr from-purple-200/40 to-pink-200/30 blur-3xl" />
      </div>

      {/* nav */}
      <header className="sticky top-0 z-20 border-b border-gray-200/60 bg-white/70 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-semibold tracking-tight text-gray-900">
                Flowglad Consulting
              </span>
            </a>

            <nav className="hidden items-center gap-6 text-sm text-gray-600 md:flex">
              <a className="hover:text-gray-900" href="#product">Product</a>
              <a className="hover:text-gray-900" href="#business">For Businesses</a>
              <a className="hover:text-gray-900" href="#consultants">For Consultants</a>
              <a className="hover:text-gray-900" href="#services">Services</a>
              <a className="hover:text-gray-900" href="#pricing">Pricing</a>
              <a className="hover:text-gray-900" href="#faq">FAQ</a>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={() => (window.location.href = '/api/auth/login')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
              <Button onClick={() => router.push('/proposal/demo')}>
                Try demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* hero */}
      <main className="relative">
        <section className="container mx-auto px-4 pt-16 pb-10 md:pt-20 md:pb-14">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-col items-center text-center">
              <Badge className="mb-6 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100">
                AI proposals + Flowglad checkout + consultant assignment by email
              </Badge>

              <h1 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 md:text-6xl">
                Turn any repository or website into a paid consulting engagement
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-gray-600 md:text-xl">
                Businesses submit a project and assign a consultant by email. Gemini analyzes the code or site, generates a proposal, and customers can pay for selected services via Flowglad checkout.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                <Button
                  size="lg"
                  onClick={() => (window.location.href = '/api/auth/login')}
                  className="h-11 px-6"
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/proposal/demo')}
                  className="h-11 px-6"
                >
                  View demo proposal
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-gray-400" /> Auth0 login
                </span>
                <span className="inline-flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" /> Flowglad checkout sessions
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" /> GitHub + websites
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* product highlights */}
        <section id="product" className="container mx-auto px-4 pb-14 md:pb-18">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <CardTitle>Proposal in minutes</CardTitle>
                  <CardDescription>
                    Gemini identifies issues and opportunities and outputs a structured proposal with recommended services.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <CardTitle>Checkout per service</CardTitle>
                  <CardDescription>
                    Customers select services and pay via Flowglad hosted checkout (no invoice creation in-app).
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <Users className="h-5 w-5" />
                  </div>
                  <CardTitle>Assign by consultant email</CardTitle>
                  <CardDescription>
                    Businesses route audits directly to the right consultant. Consultants see only requests assigned to them.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* for businesses / consultants */}
        <section className="container mx-auto px-4 pb-14 md:pb-18">
          <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-2">
            <Card id="business" className="border-gray-200/70 bg-white/70 backdrop-blur">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <CardTitle>For Businesses</CardTitle>
                <CardDescription>Get clarity, a plan, and a checkout-ready scope.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <p>
                    Submit a GitHub repo or website URL and assign a consultant by email.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <p>
                    Receive an AI-generated proposal with prioritized issues, opportunities, and recommended services.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <p>
                    Pick exactly what you want and pay instantly via Flowglad checkout.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card id="consultants" className="border-gray-200/70 bg-white/70 backdrop-blur">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle>For Consultants</CardTitle>
                <CardDescription>Close faster with consistent scopes and clean checkout.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <p>
                    See all consulting requests assigned to you via your email (no “accept” queue).
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <p>
                    Share proposals with clients; payment CTAs are shown only to businesses/clients.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-50 text-gray-700">
                    <Check className="h-4 w-4" />
                  </div>
                  <p>
                    Offer standard services (audits, optimization, migrations, retainers) with transparent pricing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* services */}
        <section id="services" className="container mx-auto px-4 pb-14 md:pb-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                  Services this platform supports
                </h2>
                <p className="mt-2 max-w-2xl text-gray-600">
                  These are the checkout-ready service SKUs backed by Flowglad price slugs.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {serviceCards.map((s) => {
                const Icon =
                  s.id === 'security-audit'
                    ? ShieldCheck
                    : s.id === 'performance-optimization'
                      ? Zap
                      : s.id === 'tech-stack-migration'
                        ? Wrench
                        : BriefcaseBusiness;
                return (
                  <Card key={s.id} className="border-gray-200/70 bg-white/70 backdrop-blur">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <CardTitle className="flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-700">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="truncate">{s.name}</span>
                          </CardTitle>
                          <CardDescription>{s.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            ${s.price.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">{s.timeline}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">Includes</div>
                      <ul className="space-y-1">
                        {s.included.map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 text-indigo-600" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* pricing */}
        <section id="pricing" className="container mx-auto px-4 pb-14 md:pb-18">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                Simple pricing
              </h2>
              <p className="mt-2 max-w-2xl text-gray-600">
                The platform is free to use. Businesses pay only for the services they select in checkout.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle>Demo</CardTitle>
                  <CardDescription>Explore the proposal experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-semibold text-gray-900">$0</div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Demo proposal viewer</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> No login required</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Great for testing UI</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/proposal/demo')}>
                    Try demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 bg-white/80 backdrop-blur shadow-sm">
                <CardHeader>
                  <Badge className="mb-2 w-fit bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100">
                    Most popular
                  </Badge>
                  <CardTitle>Business</CardTitle>
                  <CardDescription>Submit projects and pay for what you pick.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-semibold text-gray-900">$0</div>
                  <p className="text-sm text-gray-600">
                    Platform access is free. Checkout is per-service (see catalog above).
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Assign requests by consultant email</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Proposal + service selection UI</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Flowglad hosted checkout</li>
                  </ul>
                  <Button className="w-full" onClick={() => (window.location.href = '/api/auth/login')}>
                    Sign in to create a request
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle>Consultant</CardTitle>
                  <CardDescription>Receive assigned requests and get paid.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-semibold text-gray-900">$0</div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Assigned requests dashboard</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Shareable proposals</li>
                    <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-indigo-600" /> Payment tracking (in progress)</li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/api/auth/login')}>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container mx-auto px-4 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">
                FAQ
              </h2>
              <p className="mt-2 text-gray-600">
                Common questions about how this platform works.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Who triggers payment?</CardTitle>
                  <CardDescription>
                    Businesses/clients pay. Consultants never see “pay now” prompts on proposals.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Can I analyze a website instead of GitHub?</CardTitle>
                  <CardDescription>
                    Yes — submit any website URL. The analyzer supports GitHub and websites.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Do you create invoices?</CardTitle>
                  <CardDescription>
                    No — the app creates Flowglad product checkout sessions and passes proposal metadata.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200/70 bg-white/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">How do consultants receive requests?</CardTitle>
                  <CardDescription>
                    Businesses assign requests directly by entering the consultant’s email address.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* footer */}
        <footer className="border-t border-gray-200/60 bg-white/70 backdrop-blur">
          <div className="container mx-auto px-4 py-10">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Flowglad Consulting</div>
                  <div className="text-sm text-gray-600">AI proposals for real engagements.</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <a className="hover:text-gray-900" href="#pricing">Pricing</a>
                <a className="hover:text-gray-900" href="#services">Services</a>
                <a className="hover:text-gray-900" href="#faq">FAQ</a>
                <a
                  className="inline-flex items-center gap-1 hover:text-gray-900"
                  href="https://flowglad.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Flowglad <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
