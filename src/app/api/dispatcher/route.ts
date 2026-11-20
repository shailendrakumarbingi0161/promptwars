import { NextResponse } from 'next/server';
import { runFullSimulation } from '@/engine/simulationMaster';
import { generateRecoveryCandidates } from '@/engine/aiDispatcher';
import { DisruptionInput } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const disruption: DisruptionInput | null = body.disruption || null;

    const baseline = runFullSimulation(disruption, null, 'baseline_api');
    const recommendations = generateRecoveryCandidates(baseline);

    return NextResponse.json({
      baselineMetrics: baseline.metrics,
      recommendations
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal dispatcher error' }, { status: 500 });
  }
}
