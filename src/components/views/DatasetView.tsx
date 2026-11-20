'use client';

import React, { useState } from 'react';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';
import { Database, FileText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

export default function DatasetView() {
  const [activeSubTab, setActiveSubTab] = useState<'airports' | 'flights' | 'connections' | 'crews' | 'spares'>('airports');

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <Database className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">AUTHORITATIVE COMPETITION DATASET</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative Prompt War 2026 operational records: 16 Airports, 70 Flights, 16 Aircraft Rotations, 21 Passenger Connections, 16 Crew Rosters, 2 Ramp Spares.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Schema Validated</span>
          </span>
        </div>
      </div>

      {/* Dataset Nav Subtabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('airports')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'airports' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          Airports ({AUTHORITATIVE_DATASET.airports.length})
        </button>
        <button
          onClick={() => setActiveSubTab('flights')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'flights' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          Flights ({AUTHORITATIVE_DATASET.flights.length})
        </button>
        <button
          onClick={() => setActiveSubTab('connections')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'connections' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          Connections ({AUTHORITATIVE_DATASET.connections.length})
        </button>
        <button
          onClick={() => setActiveSubTab('crews')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'crews' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          Crews ({AUTHORITATIVE_DATASET.crews.length})
        </button>
        <button
          onClick={() => setActiveSubTab('spares')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeSubTab === 'spares' ? 'bg-aviation-cyan text-slate-950 font-bold' : 'glass-panel text-slate-400 hover:text-white'
          }`}
        >
          Spare Aircraft ({AUTHORITATIVE_DATASET.spare_aircraft.length})
        </button>
      </div>

      {/* Subtab Content */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder overflow-hidden">
        {activeSubTab === 'airports' && (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-aviation-darkest text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-2.5">ID</th>
                  <th className="p-2.5">NAME</th>
                  <th className="p-2.5">CITY</th>
                  <th className="p-2.5">COORDINATES</th>
                  <th className="p-2.5">TIER</th>
                  <th className="p-2.5">CAPACITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {AUTHORITATIVE_DATASET.airports.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-aviation-cyan">{a.id}</td>
                    <td className="p-2 text-white">{a.name}</td>
                    <td className="p-2 text-slate-300">{a.city}</td>
                    <td className="p-2 text-slate-400">{a.lat.toFixed(4)}, {a.lng.toFixed(4)}</td>
                    <td className="p-2 capitalize text-slate-300">{a.tier.replace('_', ' ')}</td>
                    <td className="p-2 text-white">{a.capacity_per_hour} fl/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'flights' && (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-aviation-darkest text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-2.5">FLIGHT ID</th>
                  <th className="p-2.5">TAIL ID</th>
                  <th className="p-2.5">LEG</th>
                  <th className="p-2.5">ORIGIN</th>
                  <th className="p-2.5">DEST</th>
                  <th className="p-2.5">SCHED DEP</th>
                  <th className="p-2.5">SCHED ARR</th>
                  <th className="p-2.5">BLOCK</th>
                  <th className="p-2.5">PAX</th>
                  <th className="p-2.5">TURNAROUND</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {AUTHORITATIVE_DATASET.flights.map(f => (
                  <tr key={f.flight_id} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-aviation-cyan">{f.flight_id}</td>
                    <td className="p-2 text-white">{f.tail_id}</td>
                    <td className="p-2 text-slate-400">#{f.leg_order}</td>
                    <td className="p-2 text-white">{f.origin}</td>
                    <td className="p-2 text-white">{f.destination}</td>
                    <td className="p-2 text-slate-300">{f.dep}</td>
                    <td className="p-2 text-slate-300">{f.arr}</td>
                    <td className="p-2 text-slate-400">{f.block_minutes}m</td>
                    <td className="p-2 text-white font-semibold">{f.pax}</td>
                    <td className="p-2 text-slate-400">{f.turnaround_before_min ? `${f.turnaround_before_min}m` : 'Base 30m'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'connections' && (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-aviation-darkest text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-2.5">CONNECTION ID</th>
                  <th className="p-2.5">AIRPORT</th>
                  <th className="p-2.5">FROM FLIGHT</th>
                  <th className="p-2.5">TO FLIGHT</th>
                  <th className="p-2.5">PAX</th>
                  <th className="p-2.5">MIN CONNECT TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {AUTHORITATIVE_DATASET.connections.map(c => (
                  <tr key={c.connection_id} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-aviation-cyan">{c.connection_id}</td>
                    <td className="p-2 text-white font-bold">{c.airport}</td>
                    <td className="p-2 text-white">{c.from_flight}</td>
                    <td className="p-2 text-white">{c.to_flight}</td>
                    <td className="p-2 text-amber-400 font-bold">{c.passengers}</td>
                    <td className="p-2 text-slate-300">{c.min_connect_minutes} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'crews' && (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-aviation-darkest text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-2.5">CREW ID</th>
                  <th className="p-2.5">BASE</th>
                  <th className="p-2.5">TAIL ASSIGNED</th>
                  <th className="p-2.5">DUTY START</th>
                  <th className="p-2.5">MAX DUTY</th>
                  <th className="p-2.5">FLIGHTS OPERATED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {AUTHORITATIVE_DATASET.crews.map(cr => (
                  <tr key={cr.crew_id} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-aviation-cyan">{cr.crew_id}</td>
                    <td className="p-2 text-white">{cr.base}</td>
                    <td className="p-2 text-slate-300">{cr.tail_id}</td>
                    <td className="p-2 text-slate-300">{cr.duty_start}</td>
                    <td className="p-2 text-slate-300">{cr.max_duty_mins}m (10h)</td>
                    <td className="p-2 text-slate-400">{cr.flight_ids.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSubTab === 'spares' && (
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-aviation-darkest text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="p-2.5">TAIL ID</th>
                  <th className="p-2.5">RAMP BASE</th>
                  <th className="p-2.5">AVAILABLE FROM</th>
                  <th className="p-2.5">SEAT CAPACITY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {AUTHORITATIVE_DATASET.spare_aircraft.map(s => (
                  <tr key={s.tail_id} className="hover:bg-slate-800/40">
                    <td className="p-2 font-bold text-aviation-cyan">{s.tail_id}</td>
                    <td className="p-2 text-white font-bold">{s.base}</td>
                    <td className="p-2 text-slate-300">{s.available_from} IST</td>
                    <td className="p-2 text-white">{s.seats} seats</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
