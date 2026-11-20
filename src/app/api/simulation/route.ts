import { NextResponse } from 'next/server';
import { runFullSimulation } from '@/engine/simulationMaster';
import { DisruptionInput, RecoveryAction } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const disruption: DisruptionInput | null = body.disruption || null;
    const recoveryAction: RecoveryAction | null = body.recoveryAction || null;

    const result = runFullSimulation(disruption, recoveryAction, 'api_scenario');
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal simulation error' }, { status: 500 });
  }
}
