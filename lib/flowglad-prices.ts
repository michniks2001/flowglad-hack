import 'server-only';

// Server-only mapping from our service IDs -> Flowglad Price Slugs.
// Product checkout sessions require an existing Flowglad Price (cannot be arbitrary amounts).
//
// Configure in `.env.local`, e.g.:
// FLOWGLAD_PRICE_SLUG_SECURITY_AUDIT=security-audit-single
//
// You can also use the generic fallback:
// FLOWGLAD_PRICE_SLUG_DEFAULT_PREFIX=consulting-
// which will map serviceId `security-audit` -> `consulting-security-audit`

// Defaults (based on your Flowglad dashboard slugs)
const DEFAULT_MAP: Record<string, string> = {
  'security-audit': 'security_audit',
  'performance-optimization': 'performance_optimization',
  'tech-stack-migration': 'tech_stack_migration',
  'monthly-retainer-basic': 'monthly_retainer_basic',
  'monthly-retainer-premium': 'monthly_retainer_premium',
};

const DIRECT_MAP: Record<string, string | undefined> = {
  'security-audit': process.env.FLOWGLAD_PRICE_SLUG_SECURITY_AUDIT,
  'performance-optimization': process.env.FLOWGLAD_PRICE_SLUG_PERFORMANCE_OPTIMIZATION,
  'tech-stack-migration': process.env.FLOWGLAD_PRICE_SLUG_TECH_STACK_MIGRATION,
  'monthly-retainer-basic': process.env.FLOWGLAD_PRICE_SLUG_MONTHLY_RETAINER_BASIC,
  'monthly-retainer-premium': process.env.FLOWGLAD_PRICE_SLUG_MONTHLY_RETAINER_PREMIUM,
};

export function getPriceSlugForService(serviceId: string): string | null {
  const direct = DIRECT_MAP[serviceId];
  if (direct) return direct;

  const def = DEFAULT_MAP[serviceId];
  if (def) return def;

  const prefix = process.env.FLOWGLAD_PRICE_SLUG_DEFAULT_PREFIX;
  if (prefix) return `${prefix}${serviceId}`;

  return null;
}


