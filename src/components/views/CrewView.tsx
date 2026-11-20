'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Plane
} from 'lucide-react';

export default function CrewView() {
  const { currentSim, setSelectedFlightId, setActiveTab } = useSimulation();
  const crewImpacts = currentSim.crewImpacts;

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Header Summary */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <UserCheck className="w-5 h-5" />
            <h2 className="text-base font-bold text-white tracking-wide">CREW DUTY LIMITATION MONITOR</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time compliance validation against standard 600-minute (10.0h) maximum duty period. Identifies crew timeouts and prohibited flight operations.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-aviation-darkest p-2 rounded-lg border border-slate-700">
          <div>
            <div className="text-[10px] text-slate-400">Duty Limit</div>
            <div className="text-sm font-bold text-white">600m / 10h</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[10px] text-slate-400">Legal Violations</div>
            <div className={`text-sm font-bold ${currentSim.metrics.crew_violations > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentSim.metrics.crew_violations} Crews
            </div>
          </div>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {crewImpacts.map((c) => {
          const dutyPercent = Math.min(100, Math.round((c.sim_duty_mins / c.max_duty_mins) * 100));
          const isCritical = c.margin_mins <= 30 && !c.violated;

          return (
            <div
              key={c.crew_id}
              className={`p-4 rounded-xl glass-panel border transition space-y-3 ${
                c.violated
                  ? 'border-rose-500/50 shadow-glow-rose'
                  : isCritical
                    ? 'border-amber-500/40 shadow-glow-amber'
                    : 'border-aviation-cardBorder'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-sm text-white">{c.crew_id}</span>
                    <span className="text-[10px] text-slate-400">({c.base} Base)</span>
                  </div>
                  <span className="text-[10px] text-aviation-cyan">Tail: {c.tail_id}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  c.violated
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : isCritical
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {c.violated ? 'DUTY EXCEEDED' : isCritical ? 'TIGHT MARGIN' : 'LEGAL'}
                </span>
              </div>

              {/* Duty Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Accumulated Duty:</span>
                  <span className={`font-bold ${c.violated ? 'text-rose-400' : 'text-white'}`}>
                    {c.sim_duty_mins}m / {c.max_duty_mins}m ({dutyPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      c.violated ? 'bg-rose-500' : isCritical ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${dutyPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Start: {c.duty_start}</span>
                  <span>End: {c.sim_end} (Margin: {c.margin_mins}m)</span>
                </div>
              </div>

              {/* Operating Legs */}
              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Operated Flight Legs:</div>
                <div className="flex flex-wrap gap-1">
                  {c.flights_operated.map(fid => {
                    const fRes = currentSim.flights[fid];
                    return (
                      <button
                        key={fid}
                        onClick={() => {
                          setSelectedFlightId(fid);
                          setActiveTab('dna');
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition ${
                          fRes?.dep_delay_mins > 0
                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {fid}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
