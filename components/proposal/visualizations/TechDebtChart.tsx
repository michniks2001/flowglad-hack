'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Item = { label: string; value: number };

export function TechDebtChart({ data }: { data: any }) {
  const items: Item[] = Array.isArray(data?.items)
    ? data.items
        .map((i: any) => ({
          label: String(i?.label ?? ''),
          value: Number(i?.value ?? 0),
        }))
        .filter((i: Item) => i.label && Number.isFinite(i.value))
        .slice(0, 10)
    : [];

  const max = Math.max(1, ...items.map((i) => i.value));

  const color = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('critical')) return 'bg-red-500';
    if (l.includes('high')) return 'bg-orange-500';
    if (l.includes('medium')) return 'bg-yellow-500';
    if (l.includes('low')) return 'bg-blue-500';
    return 'bg-indigo-500';
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Tech Debt Chart</span>
          <Badge variant="outline">By category</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-600">No tech-debt chart data provided for this proposal.</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-900">{it.label}</span>
                  <span className="text-gray-600">{it.value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${color(it.label)}`}
                    style={{ width: `${Math.round((it.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


