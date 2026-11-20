'use client';

import React, { useState } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';
import { RecoveryAction, RecoveryStrategyType } from '@/types';
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  Plane, 
  XOctagon, 
  ArrowLeftRight, 
  CheckCircle2, 
  TrendingDown,
  ArrowRight
} from 'lucide-react';

export default function RecoverySandboxView() {
  const { 
    disruption, 
    baselineSim, 
    recoveredSim, 
    activeRecovery, 
    applyRecoveryAction, 
    clearRecoveryAction,
    setActiveTab 
  } = useSimulation();

  const [strategyType, setStrategyType] = useState<RecoveryStrategyType>('SPARE_AIRCRAFT');
  const [selectedSpare, setSelectedSpare] = useState(AUTHORITATIVE_DATASET.spare_aircraft[0].tail_id);
  const [targetFlightForSpare, setTargetFlightForSpare] = useState(
    baselineSim.flightList.find(f => f.dep_delay_mins > 0)?.flight_id || 'DS0101'
  );
  const [flightToCancel, setFlightToCancel] = useState(
    baselineSim.flightList.find(f => f.dep_delay_mins >= 30)?.flight_id || 'DS0101'
  );

  const handleExecuteSandbox = () => {
    let action: RecoveryAction | null = null;

    if (strategyType === 'NONE') {
      clearRecoveryAction();
      return;
    }

    if (strategyType === 'SPARE_AIRCRAFT') {
      const spareObj = AUTHORITATIVE_DATASET.spare_aircraft.find(s => s.tail_id === selectedSpare);
      const targetFlight = baselineSim.flights[targetFlightForSpare];
      action = {
        type: 'SPARE_AIRCRAFT',
        spareTailId: selectedSpare,
        targetTailId: targetFlight ? targetFlight.tail_id : undefined,
        spareAvailableAirport: spareObj?.base,
        flightToReplaceId: targetFlightForSpare,
        notes: `Manual sandbox deployment of ${selectedSpare} to replace ${targetFlightForSpare}.`
      };
    } else if (strategyType === 'CANCEL_FLIGHT') {
      action = {
        type: 'CANCEL_FLIGHT',
        flightToCancelId: flightToCancel,
        notes: `Manual sandbox strategic cancellation of flight ${flightToCancel}.`
      };
    }

    if (action) {
      applyRecoveryAction(action);
    }
  };

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <Sliders className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">WHAT-IF RECOVERY SANDBOX</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test and simulate operational recovery actions (spare injection, swaps, strategic cancellations) in an isolated sandbox without altering verified baseline records.
          </p>
        </div>

        {activeRecovery && (
          <button
            onClick={clearRecoveryAction}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-aviation-darkest border border-slate-700 hover:bg-slate-800 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sandbox</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Strategy Builder */}
        <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
          <div className="text-aviation-cyan font-bold border-b border-slate-700 pb-2">
            CHOOSE RECOVERY STRATEGY
          </div>

          {/* Strategy Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-aviation-darkest p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStrategyType('SPARE_AIRCRAFT')}
              className={`p-2 rounded text-left transition ${
                strategyType === 'SPARE_AIRCRAFT' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Strategy B: Spare Aircraft
            </button>
            <button
              onClick={() => setStrategyType('CANCEL_FLIGHT')}
              className={`p-2 rounded text-left transition ${
                strategyType === 'CANCEL_FLIGHT' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Strategy C: Cancel Flight
            </button>
          </div>

          {/* Parameters for Spare Aircraft */}
          {strategyType === 'SPARE_AIRCRAFT' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1">1. Select Ramp Spare Tail:</label>
                <select
                  value={selectedSpare}
                  onChange={(e) => setSelectedSpare(e.target.value)}
                  className="w-full bg-aviation-darkest border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-aviation-cyan"
                >
                  {AUTHORITATIVE_DATASET.spare_aircraft.map(s => (
                    <option key={s.tail_id} value={s.tail_id}>
                      {s.tail_id} at {s.base} (Available {s.available_from}, 180 seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">2. Target Delayed Flight to Rescue:</label>
                <select
                  value={targetFlightForSpare}
                  onChange={(e) => setTargetFlightForSpare(e.target.value)}
                  className="w-full bg-aviation-darkest border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-aviation-cyan"
                >
                  {baselineSim.flightList.map(f => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_id} ({f.origin}→{f.destination}) — Delay: +{f.dep_delay_mins}m (Dep {f.sched_dep})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Parameters for Flight Cancellation */}
          {strategyType === 'CANCEL_FLIGHT' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Select Flight to Cancel:</label>
                <select
                  value={flightToCancel}
                  onChange={(e) => setFlightToCancel(e.target.value)}
                  className="w-full bg-aviation-darkest border border-slate-700 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-aviation-cyan"
                >
                  {baselineSim.flightList.map(f => (
                    <option key={f.flight_id} value={f.flight_id}>
                      {f.flight_id} ({f.origin}→{f.destination}) — Delay: +{f.dep_delay_mins}m ({f.pax} pax)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleExecuteSandbox}
            className="w-full py-2.5 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold transition shadow-glow-cyan flex items-center justify-center space-x-1.5"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>APPLY IN SANDBOX</span>
          </button>
        </div>

        {/* Right 2 Cols: Sandbox Delta Results */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-bold text-sm text-aviation-cyan">SANDBOX SIMULATION OUTCOME</span>
            {activeRecovery && (
              <button
                onClick={() => setActiveTab('comparison')}
                className="text-aviation-cyan hover:underline text-xs flex items-center gap-1 font-semibold"
              >
                <span>Full Comparison Deck</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recoveredSim ? (
            <div className="space-y-4">
              {/* Delta Comparison Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Total Delay Minutes</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {recoveredSim.metrics.total_dep_delay_mins}m
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    Reduced by {baselineSim.metrics.total_dep_delay_mins - recoveredSim.metrics.total_dep_delay_mins}m
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Stranded Passengers</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {recoveredSim.metrics.stranded_passengers}
                  </div>
                  <div className="text-[10px] text-amber-400 mt-0.5">
                    {baselineSim.metrics.stranded_passengers - recoveredSim.metrics.stranded_passengers} pax protected
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Crew Violations</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {recoveredSim.metrics.crew_violations}
                  </div>
                  <div className="text-[10px] text-aviation-cyan mt-0.5">
                    {baselineSim.metrics.crew_violations - recoveredSim.metrics.crew_violations} violations eliminated
                  </div>
                </div>
              </div>

              {/* Action Note */}
              <div className="p-3 rounded-lg bg-aviation-cyan/10 border border-aviation-cyan/30 text-aviation-cyan text-xs">
                <strong>Active Sandbox Directive:</strong> {activeRecovery?.notes || 'No description provided.'}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <Sliders className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="font-bold text-white">Sandbox Standing By</p>
              <p className="text-slate-500">Configure parameters on the left and click Apply in Sandbox to measure network impact.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
