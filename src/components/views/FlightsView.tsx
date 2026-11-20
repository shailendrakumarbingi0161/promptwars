'use client';

import React, { useState, useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';
import { 
  Search, 
  Filter, 
  GitFork, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Plane,
  XCircle
} from 'lucide-react';

export default function FlightsView() {
  const { currentSim, setSelectedFlightId, setActiveTab } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DELAYED' | 'ON_TIME' | 'CANCELLED'>('ALL');
  const [tailFilter, setTailFilter] = useState('ALL');

  const filteredFlights = useMemo(() => {
    return currentSim.flightList.filter(f => {
      // Search
      const matchesSearch = 
        f.flight_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tail_id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'DELAYED' && f.dep_delay_mins === 0 && f.arr_delay_mins === 0) return false;
      if (statusFilter === 'ON_TIME' && (f.dep_delay_mins > 0 || f.arr_delay_mins > 0 || f.is_cancelled)) return false;
      if (statusFilter === 'CANCELLED' && !f.is_cancelled) return false;

      // Tail Filter
      if (tailFilter !== 'ALL' && f.tail_id !== tailFilter) return false;

      return true;
    });
  }, [currentSim, searchQuery, statusFilter, tailFilter]);

  // Unique tail IDs
  const allTails = useMemo(() => {
    return Array.from(new Set(AUTHORITATIVE_DATASET.flights.map(f => f.tail_id))).sort();
  }, []);

  return (
    <div className="space-y-4 font-mono text-white">
      {/* Search and Filters Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search flight, origin, dest, tail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-aviation-darkest border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-aviation-cyan"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Buttons */}
          <div className="flex bg-aviation-darkest border border-slate-700 rounded-lg p-0.5">
            {(['ALL', 'DELAYED', 'ON_TIME', 'CANCELLED'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  statusFilter === st ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Tail filter dropdown */}
          <select
            value={tailFilter}
            onChange={(e) => setTailFilter(e.target.value)}
            className="bg-aviation-darkest border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-aviation-cyan text-[11px]"
          >
            <option value="ALL">All Aircraft (16 Tails)</option>
            {allTails.map(tail => (
              <option key={tail} value={tail}>{tail}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Flight Operations Table */}
      <div className="glass-panel rounded-xl border border-aviation-cardBorder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-aviation-darkest/80 text-slate-400 border-b border-aviation-cardBorder text-[11px]">
              <tr>
                <th className="py-3 px-4">FLIGHT</th>
                <th className="py-3 px-3">ROUTE</th>
                <th className="py-3 px-3">AIRCRAFT</th>
                <th className="py-3 px-3">SCHED DEP</th>
                <th className="py-3 px-3">ACTUAL DEP</th>
                <th className="py-3 px-3">DEP DELAY</th>
                <th className="py-3 px-3">ACTUAL ARR</th>
                <th className="py-3 px-3">TURNAROUND</th>
                <th className="py-3 px-3">CREW</th>
                <th className="py-3 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFlights.map((f) => {
                const isDelayed = f.dep_delay_mins > 0 || f.arr_delay_mins > 0;
                return (
                  <tr key={f.flight_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-bold text-white flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-aviation-cyan" />
                      <span>{f.flight_id}</span>
                      {f.is_recovered && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 rounded">
                          SPARE
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-white font-semibold">{f.origin}</span>
                      <span className="text-slate-500 mx-1">→</span>
                      <span className="text-white font-semibold">{f.destination}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span>{f.tail_id}</span>
                      {f.tail_id !== f.original_tail_id && (
                        <span className="text-[10px] text-cyan-400 ml-1">({f.original_tail_id})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{f.sched_dep}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {f.is_cancelled ? <span className="text-rose-400">CANCELLED</span> : f.sim_dep}
                    </td>
                    <td className="py-2.5 px-3">
                      {f.is_cancelled ? (
                        <span className="text-rose-400 font-bold">CANCELLED</span>
                      ) : f.dep_delay_mins > 0 ? (
                        <span className={`font-bold ${f.dep_delay_mins >= 60 ? 'text-rose-400' : 'text-amber-400'}`}>
                          +{f.dep_delay_mins}m
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">0m</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">
                      {f.is_cancelled ? '--:--' : f.sim_arr}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {f.leg_order === 1 ? (
                        <span className="text-slate-500">First Leg</span>
                      ) : (
                        <span>Req: {f.turnaround_required_mins}m</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className={f.crew_duty_exceeded ? 'text-rose-400 font-bold' : ''}>
                        {f.crew_id}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedFlightId(f.flight_id);
                          setActiveTab('dna');
                        }}
                        className="px-2.5 py-1 rounded bg-aviation-dark border border-slate-700 hover:border-aviation-cyan/40 hover:text-aviation-cyan text-slate-300 transition text-[11px] inline-flex items-center gap-1"
                      >
                        <GitFork className="w-3 h-3 text-aviation-cyan" />
                        <span>Delay DNA</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-aviation-darkest/60 border-t border-slate-800 text-slate-400 text-xs flex justify-between items-center">
          <span>Showing {filteredFlights.length} of {currentSim.flightList.length} flights</span>
          <span>{currentSim.metrics.delayed_flights} delayed • {currentSim.metrics.cancelled_flights} cancelled</span>
        </div>
      </div>
    </div>
  );
}
