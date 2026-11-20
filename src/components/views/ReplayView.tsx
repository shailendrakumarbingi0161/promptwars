'use client';

import React, { useState, useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { minsToTime, timeToMins } from '@/lib/timeUtils';
import { playRadarBlip } from '@/lib/soundEffects';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  FastForward, 
  AlertCircle, 
  Plane, 
  Users, 
  UserCheck, 
  CheckCircle2, 
  XCircle,
  Filter,
  Zap,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function ReplayView() {
  const { 
    currentSim, 
    replayTimeMins, 
    setReplayTimeMins, 
    isPlaying, 
    setIsPlaying, 
    playbackSpeed, 
    setPlaybackSpeed,
    setSelectedFlightId,
    setActiveTab,
    disruption 
  } = useSimulation();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Slider range: 05:00 (300m) to 22:00 (1320m)
  const minMins = 300;
  const maxMins = 1320;

  // Real-time snapshot metrics at the current replayTimeMins
  const snapshot = useMemo(() => {
    let airborne = 0;
    let completed = 0;
    let scheduled = 0;
    let cumulativeDelay = 0;

    for (const f of currentSim.flightList) {
      if (f.is_cancelled) continue;

      if (replayTimeMins < f.sim_dep_mins) {
        scheduled++;
      } else if (replayTimeMins >= f.sim_dep_mins && replayTimeMins <= f.sim_arr_mins) {
        airborne++;
        cumulativeDelay += f.dep_delay_mins;
      } else {
        completed++;
        cumulativeDelay += f.dep_delay_mins;
      }
    }

    // Stranded pax that occurred prior to replayTimeMins
    let strandedSoFar = 0;
    for (const cx of currentSim.passengerImpacts) {
      if (cx.status === 'MISSED_STRANDED' || cx.status === 'CANCELLED_STRANDED') {
        const fromFlight = currentSim.flights[cx.from_flight];
        if (fromFlight && fromFlight.sim_arr_mins <= replayTimeMins) {
          strandedSoFar += cx.passengers;
        }
      }
    }

    // Crew timeouts occurred prior to replayTimeMins
    let crewTimeoutsSoFar = 0;
    for (const cr of currentSim.crewImpacts) {
      if (cr.violated) {
        const timeoutPoint = cr.duty_start_mins + cr.max_duty_mins;
        if (timeoutPoint <= replayTimeMins) {
          crewTimeoutsSoFar++;
        }
      }
    }

    return {
      airborne,
      completed,
      scheduled,
      cumulativeDelay,
      strandedSoFar,
      crewTimeoutsSoFar,
    };
  }, [currentSim, replayTimeMins]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return currentSim.eventsChronological.filter(e => {
      if (categoryFilter === 'ALL') return true;
      if (categoryFilter === 'CLOSURE' && (e.type === 'CLOSURE_START' || e.type === 'CLOSURE_END')) return true;
      if (categoryFilter === 'FLIGHTS' && (e.type === 'FLIGHT_DEP' || e.type === 'FLIGHT_ARR' || e.type === 'DELAY_TRIGGER')) return true;
      if (categoryFilter === 'PAX' && e.type === 'CONNECTION_BREAK') return true;
      if (categoryFilter === 'CREW' && e.type === 'CREW_LIMIT') return true;
      if (categoryFilter === 'RECOVERY' && e.type === 'RECOVERY_APPLIED') return true;
      return false;
    });
  }, [currentSim, categoryFilter]);

  // Handle jump to specific event time
  const handleJumpToEvent = (timeMins: number, flightId?: string) => {
    playRadarBlip();
    setIsPlaying(false);
    setReplayTimeMins(timeMins);
    if (flightId) {
      setSelectedFlightId(flightId);
    }
  };

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Top Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <Clock className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">DOMINO REPLAY TIMELINE SYSTEM</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Chronological simulation playback engine. Scrub through time to observe disruption propagation, cascading aircraft rotational turnaround deficits, broken connections, and crew duty timeouts.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-aviation-darkest px-3 py-1.5 rounded-lg border border-slate-700">
          <Clock className="w-4 h-4 text-aviation-cyan" />
          <span className="text-slate-400">CURRENT SIMULATION TIME:</span>
          <span className="text-base font-bold text-aviation-cyan">{minsToTime(replayTimeMins)} IST</span>
        </div>
      </div>

      {/* Main Scrubber Deck */}
      <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
        {/* Playback Controls & Speed */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs transition shadow-glow-cyan"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE REPLAY</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START REPLAY</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setReplayTimeMins(minMins);
              }}
              className="p-2 rounded-lg bg-aviation-darkest hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              title="Restart from 05:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Playback Speeds */}
            <div className="flex items-center bg-aviation-darkest border border-slate-700 rounded-lg p-0.5 text-xs">
              {[0.5, 1, 2, 5, 10].map(s => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-2.5 py-1 rounded transition ${playbackSpeed === s ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Ticker Snapshot Indicators */}
          <div className="flex items-center space-x-3 text-[11px]">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Airborne: <strong className="text-white">{snapshot.airborne}</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Delay so far: <strong className="text-amber-400">{snapshot.cumulativeDelay}m</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Stranded: <strong className="text-rose-400">{snapshot.strandedSoFar} pax</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Crew Violations: <strong className="text-purple-300">{snapshot.crewTimeoutsSoFar}</strong></span>
            </div>
          </div>
        </div>

        {/* Big Interactive Scrubber Slider */}
        <div className="space-y-1.5 pt-2">
          <input
            type="range"
            min={minMins}
            max={maxMins}
            step={5}
            value={replayTimeMins}
            onChange={(e) => setReplayTimeMins(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-aviation-cyan"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>05:00 Morning Fleet Launch</span>
            <span>08:00 Hub Morning Rush</span>
            <span>12:00 Midday Wave</span>
            <span>16:00 Afternoon Peak</span>
            <span>20:00 Evening Rotation</span>
            <span>22:00 Day Complete</span>
          </div>
        </div>
      </div>

      {/* Chronological Event History & Filters */}
      <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
          <div className="font-bold text-sm text-aviation-cyan flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-aviation-cyan" />
            <span>DISRUPTION & RECOVERY EVENT TIMELINE ({filteredEvents.length} RECORDED EVENTS)</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-aviation-darkest p-1 rounded-lg border border-slate-800 text-[11px]">
            {['ALL', 'CLOSURE', 'FLIGHTS', 'PAX', 'CREW'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded transition ${categoryFilter === cat ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Event Feed */}
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {filteredEvents.map(event => {
            const isPastOrCurrent = event.timeMins <= replayTimeMins;
            const isNow = Math.abs(event.timeMins - replayTimeMins) <= 10;

            const severityBorder = 
              event.severity === 'critical' ? 'border-rose-500/50 hover:border-rose-500' :
              event.severity === 'warning' ? 'border-amber-500/50 hover:border-amber-500' :
              'border-slate-800 hover:border-slate-700';

            return (
              <div
                key={event.id}
                onClick={() => handleJumpToEvent(event.timeMins, event.flight_id)}
                className={`p-3 rounded-lg bg-aviation-darkest border cursor-pointer transition flex items-center justify-between ${severityBorder} ${
                  isNow ? 'bg-aviation-card border-aviation-cyan shadow-glow-cyan' : !isPastOrCurrent ? 'opacity-40' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-center font-bold font-mono w-14 shrink-0">
                    <span className="text-xs text-aviation-cyan">{event.timeStr}</span>
                    <div className="text-[9px] text-slate-500">IST</div>
                  </div>

                  <div className="h-7 w-[1px] bg-slate-800 shrink-0" />

                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>{event.title}</span>
                      {isNow && <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold">CURRENT</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{event.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    event.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    event.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {event.type}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">Jump to Event ➔</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
