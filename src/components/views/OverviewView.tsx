'use client';

import React, { useState, useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import NetworkMap from '@/components/network/NetworkMap';
import TimelineReplay from '@/components/timeline/TimelineReplay';
import { AUTHORITATIVE_DATASET, AIRPORTS_MAP } from '@/data/authoritativeDataset';
import { minsToTime, timeToMins } from '@/lib/timeUtils';
import { playRadarBlip, playAlertSiren, playSuccessChime } from '@/lib/soundEffects';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  UserCheck, 
  Plane, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sliders,
  Play,
  RotateCcw,
  Zap,
  Info,
  Radio,
  GitFork,
  ChevronRight,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

export default function OverviewView() {
  const { 
    currentSim, 
    baselineSim, 
    recoveredSim, 
    isRecoveryMode, 
    setIsRecoveryMode, 
    activeRecovery, 
    applyRecoveryAction, 
    clearRecoveryAction,
    disruption, 
    setDisruption,
    setActiveTab, 
    setSelectedFlightId, 
    recommendations,
    replayTimeMins
  } = useSimulation();

  const m = currentSim.metrics;

  // Interactive drill-down drawer state for KPI cards
  const [activeDrillDown, setActiveDrillDown] = useState<'NONE' | 'DELAYED' | 'STRANDED' | 'CREW' | 'AIRCRAFT'>('NONE');

  // Interactive Disruption Controller local states
  const [targetAirport, setTargetAirport] = useState(disruption.airportId || 'DEL');
  const [closureDuration, setClosureDuration] = useState(disruption.durationMins || 90);
  const [closureStart, setClosureStart] = useState(disruption.startTime || '08:00');

  // Threat Level assessment
  const threatLevel = useMemo(() => {
    if (m.crew_violations > 0 || m.total_dep_delay_mins > 300) {
      return { level: 'DEFCON 1: CRITICAL CASCADE', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse' };
    }
    if (m.total_dep_delay_mins > 60 || m.stranded_passengers > 0) {
      return { level: 'DEFCON 2: MODERATE DISRUPTION', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' };
    }
    if (m.delayed_flights > 0) {
      return { level: 'DEFCON 3: MINOR PROPAGATION', color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40' };
    }
    return { level: 'DEFCON 4: NOMINAL AIRSPACE', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
  }, [m]);

  // Hourly delay distribution for Recharts
  const hourlyData = useMemo(() => {
    const hours: Record<string, { hour: string; delayMins: number; flights: number }> = {};
    for (let h = 5; h <= 22; h++) {
      const key = `${h.toString().padStart(2, '0')}:00`;
      hours[key] = { hour: key, delayMins: 0, flights: 0 };
    }

    for (const f of currentSim.flightList) {
      if (f.dep_delay_mins > 0) {
        const depHour = Math.floor(f.sim_dep_mins / 60);
        const key = `${depHour.toString().padStart(2, '0')}:00`;
        if (hours[key]) {
          hours[key].delayMins += f.dep_delay_mins;
          hours[key].flights += 1;
        }
      }
    }

    return Object.values(hours);
  }, [currentSim]);

  // Active flights at the currently scrubbed replay time
  const flightsNearTime = useMemo(() => {
    return currentSim.flightList.filter(
      f => Math.abs(f.sim_dep_mins - replayTimeMins) <= 30 || Math.abs(f.sim_arr_mins - replayTimeMins) <= 30
    ).slice(0, 6);
  }, [currentSim, replayTimeMins]);

  // Apply disruption parameters immediately
  const handleUpdateDisruption = (airportId: string, duration: number, startTime: string) => {
    playAlertSiren();
    setTargetAirport(airportId);
    setClosureDuration(duration);
    setClosureStart(startTime);
    setDisruption({
      airportId,
      startTime,
      durationMins: duration
    });
  };

  const handleClearDisruption = () => {
    playRadarBlip();
    setDisruption({
      airportId: '',
      startTime: '00:00',
      durationMins: 0
    });
    clearRecoveryAction();
  };

  // Top AI recovery recommendation
  const topRec = recommendations.length > 0 ? recommendations[0] : null;

  const handleDeployTopRecovery = () => {
    if (!topRec) return;
    playSuccessChime();
    applyRecoveryAction(topRec.action);
  };

  return (
    <div className="space-y-4 font-mono text-white">
      {/* Real-Time Interactive Disruption Control Strip */}
      <div className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-aviation-cyan animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              LIVE AIRSPACE COMMAND CONTROLLER
            </span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${threatLevel.color}`}>
              {threatLevel.level}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {disruption.airportId && (
              <button
                onClick={handleClearDisruption}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Disruption (All Nominal)</span>
              </button>
            )}
            <span className="text-xs text-slate-400">Click a hub to simulate instant runway shutdown:</span>
          </div>
        </div>

        {/* Airport Quick Select Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'DEL', name: 'Delhi', tier: 'Mega Hub' },
            { id: 'BOM', name: 'Mumbai', tier: 'Mega Hub' },
            { id: 'BLR', name: 'Bengaluru', tier: 'Mega Hub' },
            { id: 'HYD', name: 'Hyderabad', tier: 'Mega Hub' },
            { id: 'CCU', name: 'Kolkata', tier: 'Regional Hub' },
            { id: 'AMD', name: 'Ahmedabad', tier: 'Regional Hub' },
            { id: 'COK', name: 'Kochi', tier: 'Regional Hub' }
          ].map(hub => {
            const isSelected = disruption.airportId === hub.id;
            return (
              <button
                key={hub.id}
                onClick={() => handleUpdateDisruption(hub.id, closureDuration, closureStart)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition flex items-center space-x-1.5 ${
                  isSelected 
                    ? 'bg-rose-500/30 border-rose-500 text-rose-300 shadow-glow-rose font-bold' 
                    : 'bg-aviation-darkest border-slate-800 text-slate-300 hover:border-aviation-cyan/50 hover:text-white'
                }`}
              >
                <span className={isSelected ? 'text-rose-400 font-black' : 'text-aviation-cyan'}>{hub.id}</span>
                <span>• {hub.name}</span>
                {isSelected && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Interactive Sliders Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs text-slate-400">
          <div>
            <div className="flex justify-between mb-1">
              <span>Adjust Closure Duration:</span>
              <span className="text-amber-400 font-bold">{closureDuration} Minutes ({Math.round(closureDuration/60*10)/10}h)</span>
            </div>
            <input
              type="range"
              min={30}
              max={240}
              step={15}
              value={closureDuration}
              onChange={(e) => {
                const val = Number(e.target.value);
                setClosureDuration(val);
                if (disruption.airportId) {
                  setDisruption({ ...disruption, durationMins: val });
                }
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Adjust Closure Start Time:</span>
              <span className="text-aviation-cyan font-bold">{closureStart} IST</span>
            </div>
            <input
              type="range"
              min={360} // 06:00
              max={1140} // 19:00
              step={30}
              value={timeToMins(closureStart)}
              onChange={(e) => {
                const val = minsToTime(Number(e.target.value));
                setClosureStart(val);
                if (disruption.airportId) {
                  setDisruption({ ...disruption, startTime: val });
                }
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-aviation-cyan"
            />
          </div>
        </div>
      </div>

      {/* Recovery Banner if active */}
      {isRecoveryMode && (
        <div className="p-3.5 rounded-xl bg-aviation-cyan/10 border border-aviation-cyan/40 flex items-center justify-between text-aviation-cyan font-mono text-xs shadow-glow-cyan">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-aviation-cyan animate-pulse" />
            <span className="font-bold">ACTIVE RECOVERY SCENARIO ENGAGED</span>
            <span className="text-slate-300">
              — Systemic delay slashed by <strong className="text-emerald-400">{baselineSim.metrics.total_dep_delay_mins - m.total_dep_delay_mins}m</strong>; <strong className="text-amber-400">{baselineSim.metrics.stranded_passengers - m.stranded_passengers}</strong> stranded passengers saved.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                playRadarBlip();
                clearRecoveryAction();
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Revert to Baseline
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className="flex items-center space-x-1 px-3 py-1 rounded bg-aviation-cyan text-slate-950 font-bold hover:bg-cyan-300 transition"
            >
              <span>Inspect Delta Deck</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Clickable KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        {/* Card 1: Delayed Flights */}
        <div 
          onClick={() => {
            playRadarBlip();
            setActiveDrillDown(activeDrillDown === 'DELAYED' ? 'NONE' : 'DELAYED');
          }}
          className={`glass-panel p-3.5 rounded-xl border cursor-pointer transition transform hover:-translate-y-0.5 ${
            activeDrillDown === 'DELAYED' ? 'border-amber-400 shadow-glow-amber bg-aviation-card' : 'border-aviation-cardBorder hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Delayed Flights</span>
            <AlertTriangle className={`w-4 h-4 ${m.delayed_flights > 0 ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{m.delayed_flights}</span>
            <span className="text-xs text-slate-500 font-normal">/ {m.total_flights} legs</span>
          </div>
          <div className="text-[10px] text-aviation-cyan mt-1 flex items-center justify-between">
            <span>Click to inspect</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: Total Delay Minutes */}
        <div 
          onClick={() => {
            playRadarBlip();
            setActiveDrillDown(activeDrillDown === 'DELAYED' ? 'NONE' : 'DELAYED');
          }}
          className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder hover:border-slate-700 cursor-pointer transition transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Total Delay Mins</span>
            <Clock className={`w-4 h-4 ${m.total_dep_delay_mins > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {m.total_dep_delay_mins}m
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Avg {m.avg_delay_mins}m per delayed leg
          </div>
        </div>

        {/* Card 3: Stranded Passengers */}
        <div 
          onClick={() => {
            playRadarBlip();
            setActiveDrillDown(activeDrillDown === 'STRANDED' ? 'NONE' : 'STRANDED');
          }}
          className={`glass-panel p-3.5 rounded-xl border cursor-pointer transition transform hover:-translate-y-0.5 ${
            activeDrillDown === 'STRANDED' ? 'border-rose-400 shadow-glow-rose bg-aviation-card' : 'border-aviation-cardBorder hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Stranded Pax</span>
            <Users className={`w-4 h-4 ${m.stranded_passengers > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {m.stranded_passengers}
          </div>
          <div className="text-[10px] text-aviation-cyan mt-1 flex items-center justify-between">
            <span>{m.missed_connections} broken transfers</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 4: Crew Violations */}
        <div 
          onClick={() => {
            playRadarBlip();
            setActiveDrillDown(activeDrillDown === 'CREW' ? 'NONE' : 'CREW');
          }}
          className={`glass-panel p-3.5 rounded-xl border cursor-pointer transition transform hover:-translate-y-0.5 ${
            activeDrillDown === 'CREW' ? 'border-rose-500 shadow-glow-rose bg-aviation-card' : 'border-aviation-cardBorder hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Crew Alerts</span>
            <UserCheck className={`w-4 h-4 ${m.crew_violations > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${m.crew_violations > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {m.crew_violations}
          </div>
          <div className="text-[10px] text-aviation-cyan mt-1 flex items-center justify-between">
            <span>&gt;600m legal limit</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 5: Affected Aircraft */}
        <div 
          onClick={() => {
            playRadarBlip();
            setActiveDrillDown(activeDrillDown === 'AIRCRAFT' ? 'NONE' : 'AIRCRAFT');
          }}
          className={`glass-panel p-3.5 rounded-xl border col-span-2 md:col-span-1 cursor-pointer transition transform hover:-translate-y-0.5 ${
            activeDrillDown === 'AIRCRAFT' ? 'border-cyan-400 shadow-glow-cyan bg-aviation-card' : 'border-aviation-cardBorder hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Affected Tails</span>
            <Plane className="w-4 h-4 text-aviation-cyan" />
          </div>
          <div className="text-2xl font-bold text-white">
            {m.affected_aircraft} <span className="text-xs text-slate-500 font-normal">/ 16</span>
          </div>
          <div className="text-[10px] text-aviation-cyan mt-1 flex items-center justify-between">
            <span>{16 - m.affected_aircraft} nominal rotations</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Interactive KPI Drill-Down Drawer */}
      {activeDrillDown !== 'NONE' && (
        <div className="glass-panel p-4 rounded-xl border border-aviation-cyan/50 shadow-glow-cyan text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="font-bold text-sm text-aviation-cyan flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>
                {activeDrillDown === 'DELAYED' && `DELAYED FLIGHTS AUDIT (${currentSim.flightList.filter(f => f.dep_delay_mins > 0).length} LEGS)`}
                {activeDrillDown === 'STRANDED' && `BROKEN PASSENGER CONNECTIONS (${currentSim.passengerImpacts.filter(p => p.status === 'MISSED_STRANDED').length} TRANSFERS)`}
                {activeDrillDown === 'CREW' && `CREW DUTY TIME RESTRICTIONS (${currentSim.crewImpacts.filter(c => c.violated).length} VIOLATIONS)`}
                {activeDrillDown === 'AIRCRAFT' && `AFFECTED AIRCRAFT ROTATIONS (${m.affected_aircraft} TAILS)`}
              </span>
            </div>
            <button
              onClick={() => setActiveDrillDown('NONE')}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drill-down contents */}
          {activeDrillDown === 'DELAYED' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {currentSim.flightList.filter(f => f.dep_delay_mins > 0).map(f => (
                <div
                  key={f.flight_id}
                  onClick={() => {
                    setSelectedFlightId(f.flight_id);
                    setActiveTab('dna');
                  }}
                  className="p-2.5 rounded-lg bg-aviation-darkest border border-slate-800 hover:border-aviation-cyan cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{f.flight_id}</span>
                      <span className="text-slate-400">({f.origin}→{f.destination})</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Tail: {f.tail_id} • Pax: {f.pax}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold">+{f.dep_delay_mins}m</span>
                    <div className="text-[10px] text-slate-400">Dep: {f.sim_dep}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeDrillDown === 'STRANDED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {currentSim.passengerImpacts.filter(p => p.status === 'MISSED_STRANDED').map(cx => (
                <div
                  key={cx.connection_id}
                  className="p-2.5 rounded-lg bg-aviation-darkest border border-rose-500/30 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-aviation-cyan">{cx.connection_id} at {cx.airport}</span>
                    <div className="text-slate-300 text-[11px] mt-0.5">{cx.from_flight} ➔ {cx.to_flight}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold">{cx.passengers} Stranded Pax</span>
                    <div className="text-[10px] text-slate-500">Window: {cx.sim_window_mins}m / {cx.min_connect_minutes}m min</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeDrillDown === 'CREW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
              {currentSim.crewImpacts.filter(c => c.violated).map(cr => (
                <div
                  key={cr.crew_id}
                  className="p-2.5 rounded-lg bg-aviation-darkest border border-rose-500/40"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">{cr.crew_id} ({cr.base})</span>
                    <span className="text-rose-400 font-bold text-[10px]">TIMEOUT</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    Accumulated Duty: <strong className="text-rose-400">{cr.sim_duty_mins}m</strong> / 600m
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Flights: {cr.flights_operated.join(', ')}</div>
                </div>
              ))}
            </div>
          )}

          {activeDrillDown === 'AIRCRAFT' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from(new Set(currentSim.flightList.filter(f => f.dep_delay_mins > 0).map(f => f.tail_id))).map(tail => {
                const tailFlights = currentSim.flightList.filter(f => f.tail_id === tail);
                const maxTailDelay = Math.max(...tailFlights.map(f => f.dep_delay_mins));
                return (
                  <div key={tail} className="p-2 rounded bg-aviation-darkest border border-slate-800">
                    <span className="font-bold text-white">{tail}</span>
                    <div className="text-[10px] text-amber-400">Max Delay: +{maxTailDelay}m</div>
                    <div className="text-[10px] text-slate-500">{tailFlights.length} legs assigned</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Interactive Grid: Radar Airspace + AI Dispatcher Action Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Interactive Radar Map & Timeline */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          <NetworkMap />
          <TimelineReplay />

          {/* Interactive Live Flight Feed at Current Scrubbed Time */}
          <div className="glass-panel p-3 rounded-xl border border-aviation-cardBorder text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-aviation-cyan flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" />
                <span>FLIGHT MOVEMENTS NEAR {minsToTime(replayTimeMins)} IST ({flightsNearTime.length} LEGS)</span>
              </span>
              <span className="text-[11px]">Click any flight to open DELAY DNA</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {flightsNearTime.map(f => (
                <button
                  key={f.flight_id}
                  onClick={() => {
                    setSelectedFlightId(f.flight_id);
                    setActiveTab('dna');
                  }}
                  className="p-2 rounded-lg bg-aviation-darkest border border-slate-800 hover:border-aviation-cyan text-left transition flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white">{f.flight_id}</div>
                    <div className="text-[10px] text-slate-400">{f.origin}→{f.destination}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{f.sim_dep}</div>
                    {f.dep_delay_mins > 0 ? (
                      <span className="text-[10px] text-rose-400 font-bold">+{f.dep_delay_mins}m</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400">On Time</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: AI Auto-Deploy Recommendation + Waveform */}
        <div className="space-y-4 font-mono">
          {/* Instant AI Recovery Card */}
          <div className="glass-panel-glow p-4 rounded-xl border border-aviation-cyan/40 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-aviation-cyan animate-pulse" />
                <span className="font-bold text-sm text-aviation-cyan">AI DISPATCHER COPILOT</span>
              </div>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/30">
                {recommendations.length} Proposals
              </span>
            </div>

            {topRec ? (
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-aviation-darkest border border-slate-700 text-xs">
                  <div className="flex items-center justify-between text-aviation-cyan font-semibold">
                    <span>Rank #1: {topRec.title}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1 line-clamp-2">
                    {topRec.summary}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 pt-2 mt-2 border-t border-slate-800 text-[10px]">
                    <div className="text-emerald-400 font-bold">
                      -{topRec.predictedImpact.delayReductionMins}m System Delay
                    </div>
                    <div className="text-amber-400 font-bold">
                      +{topRec.predictedImpact.paxSaved} Pax Saved
                    </div>
                  </div>
                </div>

                {/* 1-Click Auto-Deploy Button */}
                <button
                  onClick={handleDeployTopRecovery}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs transition shadow-glow-cyan"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>1-CLICK AUTO-DEPLOY RECOVERY</span>
                </button>

                <button
                  onClick={() => setActiveTab('dispatcher')}
                  className="w-full text-center text-slate-400 hover:text-aviation-cyan text-[11px] transition flex items-center justify-center gap-1"
                >
                  <span>Review all {recommendations.length} recovery strategies</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Airspace is operating nominally. Zero disruptions active.</span>
              </div>
            )}
          </div>

          {/* Hourly Delay Waveform Chart */}
          <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold">HOURLY DELAY PROPAGATION</span>
              <span className="text-[11px] text-slate-500">24H Profile</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2d4a" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c1322', borderColor: '#1c2d4a', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="delayMins" fill="#f43f5e" radius={[3, 3, 0, 0]} name="Delay (mins)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fast Navigation Quick Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('dna')}
              className="p-2.5 rounded-lg bg-aviation-card hover:bg-slate-800 border border-aviation-cardBorder text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <GitFork className="w-3.5 h-3.5 text-aviation-cyan" />
              <span>Delay DNA</span>
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className="p-2.5 rounded-lg bg-aviation-card hover:bg-slate-800 border border-aviation-cardBorder text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-aviation-cyan" />
              <span>Comparison</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
