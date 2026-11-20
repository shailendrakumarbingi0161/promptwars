'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import NetworkMap from '@/components/network/NetworkMap';
import TimelineReplay from '@/components/timeline/TimelineReplay';
import { AUTHORITATIVE_DATASET, AIRPORTS_MAP } from '@/data/authoritativeDataset';
import { minsToTime } from '@/lib/timeUtils';
import { MapPin, PlaneTakeoff, PlaneLanding, AlertTriangle, ArrowRight } from 'lucide-react';

export default function NetworkView() {
  const { 
    selectedAirportId, 
    setSelectedAirportId, 
    currentSim, 
    disruption,
    setSelectedFlightId,
    setActiveTab
  } = useSimulation();

  const selectedAirport = selectedAirportId ? AIRPORTS_MAP.get(selectedAirportId) : null;

  const airportDepartures = React.useMemo(() => {
    if (!selectedAirportId) return [];
    return currentSim.flightList.filter(f => f.origin === selectedAirportId);
  }, [selectedAirportId, currentSim]);

  const airportArrivals = React.useMemo(() => {
    if (!selectedAirportId) return [];
    return currentSim.flightList.filter(f => f.destination === selectedAirportId);
  }, [selectedAirportId, currentSim]);

  return (
    <div className="space-y-4 font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Radar */}
        <div className="lg:col-span-2 space-y-3">
          <NetworkMap />
          <TimelineReplay />
        </div>

        {/* Airport Flight Board & Station Details */}
        <div className="space-y-4">
          {selectedAirport ? (
            <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder space-y-4 text-xs">
              {/* Station Banner */}
              <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-aviation-cyan" />
                    <span className="text-base font-bold text-white">{selectedAirport.id} • {selectedAirport.city}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedAirport.name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    disruption?.airportId === selectedAirport.id 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {disruption?.airportId === selectedAirport.id ? 'CLOSED' : 'OPEN'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">Cap: {selectedAirport.capacity_per_hour}/hr</div>
                </div>
              </div>

              {/* Station Operations Tabs */}
              <div>
                <div className="text-[11px] font-bold text-aviation-cyan mb-2 flex items-center gap-1.5">
                  <PlaneTakeoff className="w-3.5 h-3.5" />
                  <span>SCHEDULED DEPARTURES ({airportDepartures.length})</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {airportDepartures.map(f => (
                    <div
                      key={f.flight_id}
                      onClick={() => {
                        setSelectedFlightId(f.flight_id);
                        setActiveTab('dna');
                      }}
                      className="p-2 rounded bg-aviation-darkest border border-slate-800 hover:border-aviation-cyan/40 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{f.flight_id}</span>
                          <span className="text-slate-400">→ {f.destination}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Tail: {f.tail_id} • Pax: {f.pax}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{f.sim_dep}</div>
                        {f.dep_delay_mins > 0 ? (
                          <span className="text-rose-400 text-[10px]">+{f.dep_delay_mins}m</span>
                        ) : (
                          <span className="text-emerald-400 text-[10px]">On Time</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-aviation-cyan mb-2 flex items-center gap-1.5">
                  <PlaneLanding className="w-3.5 h-3.5" />
                  <span>SCHEDULED ARRIVALS ({airportArrivals.length})</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {airportArrivals.map(f => (
                    <div
                      key={f.flight_id}
                      onClick={() => {
                        setSelectedFlightId(f.flight_id);
                        setActiveTab('dna');
                      }}
                      className="p-2 rounded bg-aviation-darkest border border-slate-800 hover:border-aviation-cyan/40 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white">{f.flight_id}</span>
                          <span className="text-slate-400">{f.origin} →</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Tail: {f.tail_id}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">{f.sim_arr}</div>
                        {f.arr_delay_mins > 0 ? (
                          <span className="text-rose-400 text-[10px]">+{f.arr_delay_mins}m</span>
                        ) : (
                          <span className="text-emerald-400 text-[10px]">On Time</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-xl border border-aviation-cardBorder text-center text-slate-400 text-xs">
              Select an airport on the radar map to inspect scheduled operations and arrivals/departures.
            </div>
          )}

          {/* Airport Quick Switcher Grid */}
          <div className="glass-panel p-3 rounded-xl border border-aviation-cardBorder">
            <div className="text-slate-400 text-xs mb-2 font-bold">16 NETWORK STATIONS</div>
            <div className="grid grid-cols-4 gap-1.5 text-xs">
              {AUTHORITATIVE_DATASET.airports.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAirportId(a.id)}
                  className={`py-1.5 rounded text-center transition ${
                    selectedAirportId === a.id
                      ? 'bg-aviation-cyan text-slate-950 font-bold shadow-glow-cyan'
                      : 'bg-aviation-darkest hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {a.id}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
