'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type RiskItem = {
  name: string;
  severity: number; // 1-10
  likelihood: number; // 1-10
};

function bucket(score: number): 'low' | 'medium' | 'high' {
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function cellClass(x: 'low' | 'medium' | 'high', y: 'low' | 'medium' | 'high') {
  // severity (y) x likelihood (x)
  if (x === 'high' && y === 'high') return 'bg-red-50 border-red-200';
  if ((x === 'high' && y === 'medium') || (x === 'medium' && y === 'high')) return 'bg-orange-50 border-orange-200';
  if (x === 'medium' && y === 'medium') return 'bg-yellow-50 border-yellow-200';
  if (x === 'low' && y === 'high') return 'bg-orange-50 border-orange-200';
  if (x === 'high' && y === 'low') return 'bg-yellow-50 border-yellow-200';
  return 'bg-gray-50 border-gray-200';
}

export function RiskMatrix({ data }: { data: any }) {
  const items: RiskItem[] = Array.isArray(data?.items)
    ? data.items
        .map((i: any) => ({
          name: String(i?.name ?? '').slice(0, 120),
          severity: Number(i?.severity ?? 0),
          likelihood: Number(i?.likelihood ?? 0),
        }))
        .filter((i: RiskItem) => i.name && Number.isFinite(i.severity) && Number.isFinite(i.likelihood))
        .slice(0, 12)
    : [];

  const cells: Record<string, RiskItem[]> = {
    'low-low': [],
    'medium-low': [],
    'high-low': [],
    'low-medium': [],
    'medium-medium': [],
    'high-medium': [],
    'low-high': [],
    'medium-high': [],
    'high-high': [],
  };

  for (const it of items) {
    const x = bucket(Math.max(0, Math.min(10, it.likelihood)));
    const y = bucket(Math.max(0, Math.min(10, it.severity)));
    cells[`${x}-${y}`].push(it);
  }

  const axisLabel = (v: 'low' | 'medium' | 'high') => (v === 'low' ? 'Low' : v === 'medium' ? 'Medium' : 'High');

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Risk Matrix</span>
          <Badge variant="outline">Likelihood × Severity</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div />
          <div className="text-center text-gray-500">{axisLabel('low')}</div>
          <div className="text-center text-gray-500">{axisLabel('medium')}</div>
          <div className="text-center text-gray-500">{axisLabel('high')}</div>

          {(['high', 'medium', 'low'] as const).map((sev) => (
            <div key={sev} className="contents">
              <div className="flex items-center justify-end pr-2 text-gray-500">{axisLabel(sev)}</div>
              {(['low', 'medium', 'high'] as const).map((lik) => {
                const key = `${lik}-${sev}`;
                const list = cells[key] || [];
                return (
                  <div
                    key={key}
                    className={`min-h-[72px] rounded-lg border p-2 ${cellClass(lik, sev)}`}
                  >
                    <div className="space-y-1">
                      {list.slice(0, 3).map((it) => (
                        <div key={it.name} className="truncate text-gray-700">
                          • {it.name}
                        </div>
                      ))}
                      {list.length > 3 && (
                        <div className="text-gray-500">+{list.length - 3} more</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-sm text-gray-600">
            No risk-matrix data provided for this proposal.
          </p>
        )}
      </CardContent>
    </Card>
  );
}


