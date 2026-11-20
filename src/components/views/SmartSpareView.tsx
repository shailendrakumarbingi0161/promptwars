'use client';

import React, { useMemo, useState } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';
import { generateSmartSpareAllocations } from '@/engine/smartSpareEngine';
import { SpareAllocationCandidate } from '@/types/advancedFeatures';
import { 
  Plane, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Zap,
  Sliders,
  AlertTriangle
} from 'lucide-react';

export default function SmartSpareView() {
  const { 
    baselineSim, 
    recoveredSim, 
    activeRecovery, 
    applyRecoveryAction, 
    clearRecoveryAction, 
    setActiveTab 
  } = useSimulation();

  const candidates = useMemo(() => {
    return generateSmartSpareAllocations(baselineSim);
  }, [baselineSim]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    candidates.length > 0 ? candidates[0].id : null
  );

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  const handleApplyAllocation = (cand: SpareAllocationCandidate) => {
    applyRecoveryAction({
      type: 'SPARE_AIRCRAFT',
      spareTailId: cand.spareTailId,
      targetTailId: cand.originalTailId,
      spareAvailableAirport: cand.currentAirport,
      flightToReplaceId: cand.targetFlightId,
      notes: `Smart Spare Allocation: Deployed ${cand.spareTailId} (${cand.currentAirport}) for leg ${cand.targetFlightId}.`,
    });
    setActiveTab('comparison');
  };

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Top Telemetry Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cyan/40 shadow-glow-cyan flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <Plane className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">SMART SPARE AIRCRAFT ALLOCATION ENGINE</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic multi-objective spare aircraft allocation algorithm. Evaluates colocation, ferry positioning, turnaround constraints, and passenger/crew impact.
          </p>
        </div>

        {activeRecovery && activeRecovery.type === 'SPARE_AIRCRAFT' ? (
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-aviation-cyan font-bold bg-aviation-cyan/15 border border-aviation-cyan/30 px-2.5 py-1 rounded">
              Active Spare: {activeRecovery.spareTailId}
            </span>
            <button
              onClick={clearRecoveryAction}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition"
            >
              Revert
            </button>
          </div>
        ) : (
          <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
            2 Spares In Inventory
          </span>
        )}
      </div>

      {/* Available Spare Aircraft Fleet Cards */}
      <div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          AUTHORITATIVE SPARE FLEET INVENTORY ({AUTHORITATIVE_DATASET.spare_aircraft.length} AIRCRAFT)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AUTHORITATIVE_DATASET.spare_aircraft.map((spare) => {
            const isAssigned = activeRecovery?.spareTailId === spare.tail_id;
            return (
              <div
                key={spare.tail_id}
                className={`p-4 rounded-xl glass-panel border transition space-y-2 ${
                  isAssigned 
                    ? 'border-aviation-cyan bg-aviation-card shadow-glow-cyan' 
                    : 'border-aviation-cardBorder'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{spare.tail_id}</span>
                    <span className="text-[10px] text-slate-400 bg-aviation-darkest px-1.5 py-0.5 rounded border border-slate-800">
                      Ramp Base: <strong className="text-aviation-cyan">{spare.base}</strong>
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isAssigned 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isAssigned ? 'DEPLOYED ON MISSION' : 'AVAILABLE ON STANDBY'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
                  <div>Available From: <span className="text-white font-semibold">{spare.available_from} IST</span></div>
                  <div>Seating: <span className="text-white font-semibold">{spare.seats} Seats</span></div>
                  <div>Fleet Type: <span className="text-aviation-cyan">Uniform A320</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Allocation Evaluation Grid */}
      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          {/* Left Column: Ranked Candidates List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Evaluated Allocations ({candidates.length} Feasible Options)
            </div>
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {candidates.map((cand, idx) => {
                const isSelected = selectedCandidate?.id === cand.id;
                const isOptimal = cand.status === 'OPTIMAL';

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={`p-3.5 rounded-xl glass-panel border cursor-pointer transition space-y-2 ${
                      isSelected 
                        ? 'border-aviation-cyan/70 bg-aviation-card shadow-glow-cyan' 
                        : 'border-aviation-cardBorder hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOptimal 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/30'
                      }`}>
                        #{idx + 1} {cand.status} • SCORE: {cand.allocationScore}
                      </span>
                      <span className="text-emerald-400 font-bold text-[11px]">
                        -{cand.delayReductionMins}m Delay
                      </span>
                    </div>

                    <div className="font-bold text-white text-xs">
                      Inject {cand.spareTailId} ➔ Rescue Flight {cand.targetFlightId}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Original: {cand.originalTailId} (+{cand.originalFlightDelayMins}m)</span>
                      <span>Revised: <strong className="text-emerald-400">+{cand.revisedFlightDelayMins}m</strong></span>
                    </div>

                    {cand.positioningRequired && (
                      <div className="text-[10px] text-amber-400">
                        ⚠ Ferry Positioning: {cand.positioningTimeMins}m from {cand.currentAirport} to {cand.targetAirport}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Detailed Candidate Audit Deck */}
          {selectedCandidate && (
            <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white">
                      Allocation Plan: {selectedCandidate.spareTailId} ➔ {selectedCandidate.targetFlightId}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Original Aircraft: {selectedCandidate.originalTailId} | Base: {selectedCandidate.currentAirport} ➔ Mission Origin: {selectedCandidate.targetAirport}
                  </p>
                </div>
                <button
                  onClick={() => handleApplyAllocation(selectedCandidate)}
                  className="px-4 py-2 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-glow-cyan"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>EXECUTE THIS ALLOCATION</span>
                </button>
              </div>

              {/* Quantifiable Impact Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Net Delay Reduction</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    -{selectedCandidate.delayReductionMins}m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Revised delay: +{selectedCandidate.revisedFlightDelayMins}m
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Connecting Pax Protected</div>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">
                    +{selectedCandidate.passengersProtected} Pax
                  </div>
                  <div className="text-[10px] text-slate-400">Connections preserved</div>
                </div>

                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Positioning Ferry Time</div>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {selectedCandidate.positioningTimeMins}m
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedCandidate.positioningRequired ? 'Inter-station ferry flight' : 'Co-located on ramp'}
                  </div>
                </div>
              </div>

              {/* Operational Rationale */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-aviation-cyan">OPERATIONAL RATIONALE & STRATEGY</div>
                <p className="p-3 rounded-lg bg-aviation-darkest border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedCandidate.operationalRationale}
                </p>
              </div>

              {/* Constraint Verifications */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-400">DETERMINISTIC CONSTRAINTS VERIFICATION</div>
                <div className="space-y-1.5">
                  {selectedCandidate.constraintsChecked.map((chk, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-aviation-darkest border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {chk.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-semibold text-white">{chk.rule}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{chk.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-10 rounded-xl border border-aviation-cardBorder text-center text-slate-400 text-xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="font-bold text-white text-sm">No Affected Flights In Active Scenario</p>
          <p className="text-slate-500">All 70 flights are operating on-time. Simulate a disruption to evaluate smart spare allocation candidates.</p>
        </div>
      )}
    </div>
  );
}
