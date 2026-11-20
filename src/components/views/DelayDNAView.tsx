'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { 
  GitFork, 
  ArrowDown, 
  Plane, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Users, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export default function DelayDNAView() {
  const { 
    currentSim, 
    selectedFlightId, 
    setSelectedFlightId, 
    setActiveTab 
  } = useSimulation();

  const flight = selectedFlightId ? currentSim.flights[selectedFlightId] : null;

  return (
    <div className="space-y-4 font-mono text-white">
      {/* Flight Selector Bar */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <GitFork className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">DELAY DNA™ – EXPLAINABLE CAUSALITY TRACKER</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mathematical step-by-step root-cause reconstruction. Trace delays through airport ground holds, aircraft rotational turnarounds, crew duty limits, and broken passenger transfers.
          </p>
        </div>

        {/* Flight Picker */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-slate-400 whitespace-nowrap">Select Flight:</span>
          <select
            value={selectedFlightId || ''}
            onChange={(e) => setSelectedFlightId(e.target.value)}
            className="bg-aviation-darkest border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-aviation-cyan text-xs font-mono font-bold"
          >
            {currentSim.flightList.map(f => (
              <option key={f.flight_id} value={f.flight_id}>
                {f.flight_id} ({f.origin}→{f.destination}) — {f.dep_delay_mins > 0 ? `+${f.dep_delay_mins}m Delay` : 'On Time'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {flight ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Flight Summary Card */}
          <div className="space-y-4">
            <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-3 text-xs">
              <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-xl font-black text-white">{flight.flight_id}</span>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {flight.origin} → {flight.destination} • Leg #{flight.leg_order}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    flight.is_cancelled 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : flight.dep_delay_mins > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {flight.is_cancelled ? 'CANCELLED' : flight.dep_delay_mins > 0 ? `+${flight.dep_delay_mins}m DELAYED` : 'ON TIME'}
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="p-2 rounded bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500">Aircraft Tail</div>
                  <div className="font-bold text-white mt-0.5">{flight.tail_id}</div>
                </div>
                <div className="p-2 rounded bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500">Assigned Crew</div>
                  <div className="font-bold text-white mt-0.5">{flight.crew_id}</div>
                </div>
                <div className="p-2 rounded bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500">Scheduled Sched</div>
                  <div className="font-bold text-white mt-0.5">{flight.sched_dep} - {flight.sched_arr}</div>
                </div>
                <div className="p-2 rounded bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500">Actual Simulated</div>
                  <div className="font-bold text-aviation-cyan mt-0.5">{flight.sim_dep} - {flight.sim_arr}</div>
                </div>
                <div className="p-2 rounded bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500">Turnaround Required</div>
                  <div className="font-bold text-white mt-0.5">{flight.turnaround_required_mins} mins</div>
                </div>
                <div className="p-2 rounded bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500">Onboard Passengers</div>
                  <div className="font-bold text-white mt-0.5">{flight.pax} pax</div>
                </div>
              </div>

              {/* Primary Root Cause Badge */}
              <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                <div className="text-slate-500 text-[10px] uppercase font-bold">Primary Diagnosed Cause</div>
                <div className="text-xs font-semibold text-rose-300 mt-1 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{flight.primary_cause}</span>
                </div>
              </div>

              {/* Quick Jump to Dispatcher */}
              <button
                onClick={() => setActiveTab('dispatcher')}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 rounded-lg bg-aviation-cyan/20 hover:bg-aviation-cyan/30 text-aviation-cyan border border-aviation-cyan/40 text-xs font-bold transition shadow-glow-cyan"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask AI Dispatcher for Recovery Plan</span>
              </button>
            </div>
          </div>

          {/* Right 2 Columns: Chronological DNA Propagation Tree */}
          <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="font-bold text-sm text-aviation-cyan">CAUSALITY CHAIN DECONSTRUCTION</span>
              <span className="text-[11px] text-slate-400">{flight.delay_dna.length} Chain Nodes Identified</span>
            </div>

            {flight.delay_dna.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
                {flight.delay_dna.map((node, index) => {
                  return (
                    <div key={index} className="relative group">
                      {/* Node Bullet Icon */}
                      <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-aviation-darkest border-2 border-aviation-cyan flex items-center justify-center text-[10px] font-bold text-aviation-cyan z-10 shadow-glow-cyan">
                        {node.stage}
                      </div>

                      {/* Content Card */}
                      <div className="p-4 rounded-xl bg-aviation-darkest border border-slate-800 hover:border-slate-700 transition space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{node.title}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            node.delay_added_mins > 0 
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {node.delay_added_mins > 0 ? `+${node.delay_added_mins}m Delay Added` : 'Cumulative Impact'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {node.description}
                        </p>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 pt-1">
                          {node.airport && <span>Station: <strong className="text-slate-400">{node.airport}</strong></span>}
                          {node.flight_id && <span>Ref Leg: <strong className="text-slate-400">{node.flight_id}</strong></span>}
                          {node.tail_id && <span>Aircraft: <strong className="text-slate-400">{node.tail_id}</strong></span>}
                          <span>Total Calculated Delay: <strong className="text-aviation-cyan">{node.cumulative_delay_mins}m</strong></span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-white">No Delay Propagation Detected</p>
                <p className="text-slate-500">Flight {flight.flight_id} is operating on-time with full turnaround slack and intact passenger connections.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-xl border border-aviation-cardBorder text-center text-slate-400 text-xs">
          Select a flight from the dropdown to analyze its DELAY DNA.
        </div>
      )}
    </div>
  );
}
