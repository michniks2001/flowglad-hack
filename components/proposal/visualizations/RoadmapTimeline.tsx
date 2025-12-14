'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Phase = { name: string; duration?: string; items?: string[] };

export function RoadmapTimeline({ data }: { data: any }) {
  const phases: Phase[] = Array.isArray(data?.phases)
    ? data.phases
        .map((p: any) => ({
          name: String(p?.name ?? ''),
          duration: typeof p?.duration === 'string' ? p.duration : undefined,
          items: Array.isArray(p?.items) ? p.items.map((x: any) => String(x)).filter(Boolean).slice(0, 8) : [],
        }))
        .filter((p: Phase) => p.name)
        .slice(0, 6)
    : [];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Roadmap Timeline</span>
          <Badge variant="outline">Phased delivery</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {phases.length === 0 ? (
          <p className="text-sm text-gray-600">No roadmap timeline data provided for this proposal.</p>
        ) : (
          <div className="relative space-y-6">
            <div className="absolute left-[11px] top-1 bottom-1 w-px bg-gray-200" />
            {phases.map((phase, idx) => (
              <div key={`${phase.name}-${idx}`} className="relative flex gap-4">
                <div className="mt-1 h-6 w-6 rounded-full border border-gray-300 bg-white flex items-center justify-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-gray-900">{phase.name}</div>
                    {phase.duration && (
                      <Badge variant="secondary">{phase.duration}</Badge>
                    )}
                  </div>
                  {phase.items && phase.items.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      {phase.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-gray-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


