'use client';

import React, { useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function PassengersView() {
  const { currentSim, setSelectedFlightId, setActiveTab } = useSimulation();
  const impacts = currentSim.passengerImpacts;

  const totalPaxInConnections = useMemo(() => {
    return impacts.reduce((sum, c) => sum + c.passengers, 0);
  }, [impacts]);

  const missedCount = impacts.filter(c => c.status === 'MISSED_STRANDED' || c.status === 'CANCELLED_STRANDED');
  const maintainedCount = impacts.filter(c => c.status === 'MAINTAINED');

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Header Summary */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-amber-400">
            <Users className="w-5 h-5" />
            <h2 className="text-base font-bold text-white tracking-wide">PASSENGER CONNECTION INTELLIGENCE</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic passenger itinerary audit across all 21 hub transfers. Tracks minimum connection times (MCT) and stranded passenger tallies.
          </p>
        </div>

        {/* Stranded Pax Metric Pill */}
        <div className="flex items-center space-x-3 bg-aviation-darkest p-2 rounded-lg border border-slate-700">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Total Stranded</div>
            <div className="text-base font-bold text-rose-400">{currentSim.metrics.stranded_passengers} Pax</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-700" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Maintained</div>
            <div className="text-base font-bold text-emerald-400">
              {totalPaxInConnections - currentSim.metrics.stranded_passengers} Pax
            </div>
          </div>
        </div>
      </div>

      {/* Connection Table */}
      <div className="glass-panel rounded-xl border border-aviation-cardBorder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-aviation-darkest/80 text-slate-400 border-b border-aviation-cardBorder text-[11px]">
              <tr>
                <th className="py-3 px-4">CONN ID</th>
                <th className="py-3 px-3">TRANSFER AIRPORT</th>
                <th className="py-3 px-3">INBOUND FLIGHT</th>
                <th className="py-3 px-3">OUTBOUND FLIGHT</th>
                <th className="py-3 px-3">PAX</th>
                <th className="py-3 px-3">MIN MCT</th>
                <th className="py-3 px-3">SCHED WINDOW</th>
                <th className="py-3 px-3">ACTUAL WINDOW</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">EXPLANATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {impacts.map((cx) => {
                const isMissed = cx.status === 'MISSED_STRANDED' || cx.status === 'CANCELLED_STRANDED';
                const fromFlight = currentSim.flights[cx.from_flight];
                const toFlight = currentSim.flights[cx.to_flight];

                return (
                  <tr key={cx.connection_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white">{cx.connection_id}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-aviation-cyan">{cx.airport}</span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          setSelectedFlightId(cx.from_flight);
                          setActiveTab('dna');
                        }}
                        className="text-white hover:text-aviation-cyan underline decoration-slate-600 underline-offset-2 font-bold"
                      >
                        {cx.from_flight}
                      </button>
                      {fromFlight && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({fromFlight.sim_arr} / {fromFlight.arr_delay_mins > 0 ? `+${fromFlight.arr_delay_mins}m` : '0m'})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          setSelectedFlightId(cx.to_flight);
                          setActiveTab('dna');
                        }}
                        className="text-white hover:text-aviation-cyan underline decoration-slate-600 underline-offset-2 font-bold"
                      >
                        {cx.to_flight}
                      </button>
                      {toFlight && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          (Dep: {toFlight.sim_dep})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{cx.passengers} pax</td>
                    <td className="py-3 px-3 text-slate-400">{cx.min_connect_minutes}m</td>
                    <td className="py-3 px-3 text-slate-400">{cx.sched_window_mins}m</td>
                    <td className="py-3 px-3 font-semibold">
                      <span className={cx.sim_window_mins < cx.min_connect_minutes ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {cx.sim_window_mins}m
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                        isMissed 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {isMissed ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        <span>{isMissed ? 'MISSED / STRANDED' : 'MAINTAINED'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-[11px] text-slate-400 max-w-xs truncate">
                      {cx.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
