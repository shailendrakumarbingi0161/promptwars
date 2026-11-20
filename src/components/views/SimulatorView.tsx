'use client';

import React, { useState } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { AUTHORITATIVE_DATASET, AIRPORTS_MAP } from '@/data/authoritativeDataset';
import { timeToMins, minsToTime } from '@/lib/timeUtils';
import { 
  AlertOctagon, 
  Clock, 
  RotateCcw, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  PlaneTakeoff,
  PlaneLanding,
  ArrowRight
} from 'lucide-react';

export default function SimulatorView() {
  const { 
    disruption, 
    setDisruption, 
    currentSim, 
    resetAll, 
    setActiveTab,
    setSelectedFlightId 
  } = useSimulation();

  const [localAirport, setLocalAirport] = useState(disruption.airportId || 'DEL');
  const [localStartTime, setLocalStartTime] = useState(disruption.startTime || '08:00');
  const [localDuration, setLocalDuration] = useState(disruption.durationMins || 90);

  const reopeningMins = timeToMins(localStartTime) + Number(localDuration);
  const reopeningTime = minsToTime(reopeningMins);

  const applySimulation = () => {
    setDisruption({
      airportId: localAirport,
      startTime: localStartTime,
      durationMins: Number(localDuration)
    });
  };

  // Directly affected flights by this closure
  const directlyAffectedDepartures = currentSim.flightList.filter(
    f => f.origin === localAirport && f.affected_by_closure
  );

  const directlyAffectedArrivals = currentSim.flightList.filter(
    f => f.destination === localAirport && f.affected_by_closure
  );

  return (
    <div className="space-y-4 font-mono text-white">
      {/* Top Banner */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-rose">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
            <h2 className="font-bold text-base tracking-wide text-white">INTERACTIVE AIRPORT DISRUPTION SIMULATOR</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate emergency runway shutdowns, severe weather ground stops, or ATC capacity closures. Observe deterministic delay ripple across all 16 fleet rotations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={resetAll}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-aviation-darkest border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Scenario</span>
          </button>
        </div>
      </div>

      {/* Main Simulation Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Input Controls */}
        <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4 text-xs">
          <div className="text-aviation-cyan font-bold border-b border-slate-700 pb-2">
            DISRUPTION PARAMETERS
          </div>

          {/* Airport Selector */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-bold">1. TARGET AIRPORT</label>
            <select
              value={localAirport}
              onChange={(e) => setLocalAirport(e.target.value)}
              className="w-full bg-aviation-darkest border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-aviation-cyan font-mono"
            >
              {AUTHORITATIVE_DATASET.airports.map(a => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.city} ({a.tier.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Start Time Slider */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1.5">
              <span className="font-bold">2. CLOSURE START TIME</span>
              <span className="text-aviation-cyan font-bold">{localStartTime} IST</span>
            </div>
            <input
              type="range"
              min={300} // 05:00
              max={1260} // 21:00
              step={15}
              value={timeToMins(localStartTime)}
              onChange={(e) => setLocalStartTime(minsToTime(Number(e.target.value)))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-aviation-cyan"
            />
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>05:00</span>
              <span>12:00</span>
              <span>21:00</span>
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex justify-between text-slate-400 mb-1.5">
              <span className="font-bold">3. CLOSURE DURATION</span>
              <span className="text-amber-400 font-bold">{localDuration} Minutes ({Math.round(localDuration/60 * 10)/10}h)</span>
            </div>
            <input
              type="range"
              min={15}
              max={300}
              step={15}
              value={localDuration}
              onChange={(e) => setLocalDuration(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>15m</span>
              <span>120m (2h)</span>
              <span>300m (5h)</span>
            </div>
          </div>

          {/* Reopening Time Summary */}
          <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-400">
              <span>Scheduled Reopening:</span>
              <span className="text-emerald-400 font-bold">{reopeningTime} IST</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Operating Program:</span>
              <span className="text-slate-300">Ground Delay Program (GDP)</span>
            </div>
          </div>

          {/* Run Simulation Button */}
          <button
            onClick={applySimulation}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs transition shadow-glow-cyan"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>EXECUTE DISRUPTION SIMULATION</span>
          </button>
        </div>

        {/* Right 2 Cols: Immediate Affected Flights Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <div className="font-bold text-sm text-aviation-rose flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>DIRECTLY IMPACTED AT {disruption.airportId} ({directlyAffectedDepartures.length + directlyAffectedArrivals.length} Flights)</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                Window: {disruption.startTime} - {minsToTime(timeToMins(disruption.startTime) + disruption.durationMins)}
              </span>
            </div>

            {/* Departures Grid */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <PlaneTakeoff className="w-3.5 h-3.5 text-aviation-cyan" />
                <span>HELD DEPARTURES AT {disruption.airportId} ({directlyAffectedDepartures.length})</span>
              </div>
              {directlyAffectedDepartures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {directlyAffectedDepartures.map(f => (
                    <div
                      key={f.flight_id}
                      onClick={() => {
                        setSelectedFlightId(f.flight_id);
                        setActiveTab('dna');
                      }}
                      className="p-2.5 rounded-lg bg-aviation-darkest border border-rose-500/30 hover:border-rose-500 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{f.flight_id}</span>
                          <span className="text-slate-400">→ {f.destination}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Tail: {f.tail_id} • Pax: {f.pax}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-rose-400 font-bold">+{f.dep_delay_mins}m delay</div>
                        <div className="text-[10px] text-slate-400">Dep: {f.sim_dep}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">No departures scheduled during this closure window.</p>
              )}
            </div>

            {/* Arrivals Grid */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                <PlaneLanding className="w-3.5 h-3.5 text-amber-400" />
                <span>GROUND HELD ARRIVALS INBOUND TO {disruption.airportId} ({directlyAffectedArrivals.length})</span>
              </div>
              {directlyAffectedArrivals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {directlyAffectedArrivals.map(f => (
                    <div
                      key={f.flight_id}
                      onClick={() => {
                        setSelectedFlightId(f.flight_id);
                        setActiveTab('dna');
                      }}
                      className="p-2.5 rounded-lg bg-aviation-darkest border border-amber-500/30 hover:border-amber-500 cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{f.flight_id}</span>
                          <span className="text-slate-400">{f.origin} →</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Tail: {f.tail_id} • Pax: {f.pax}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold">+{f.arr_delay_mins}m delay</div>
                        <div className="text-[10px] text-slate-400">Arr: {f.sim_arr}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs italic">No arrivals scheduled during this closure window.</p>
              )}
            </div>

            {/* Next Steps CTA */}
            <div className="pt-3 border-t border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-400">Explore downstream rotational domino effects:</span>
              <button
                onClick={() => setActiveTab('dna')}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-aviation-card hover:bg-slate-800 border border-aviation-cyan/40 text-aviation-cyan font-bold transition"
              >
                <span>Launch DELAY DNA Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
