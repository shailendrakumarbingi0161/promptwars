'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import NetworkMap from '@/components/network/NetworkMap';
import TimelineReplay from '@/components/timeline/TimelineReplay';
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
  CheckCircle2
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
  const { currentSim, baselineSim, recoveredSim, isRecoveryMode, setActiveTab, recommendations } = useSimulation();
  const m = currentSim.metrics;

  // Hourly delay distribution for Recharts
  const hourlyData = React.useMemo(() => {
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

  return (
    <div className="space-y-4">
      {/* Recovery Banner if active */}
      {isRecoveryMode && (
        <div className="p-3 rounded-xl bg-aviation-cyan/10 border border-aviation-cyan/40 flex items-center justify-between text-aviation-cyan font-mono text-xs shadow-glow-cyan">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-aviation-cyan animate-pulse" />
            <span className="font-bold">ACTIVE RECOVERY SCENARIO ENGAGED</span>
            <span className="text-slate-300">
              — Delay reduced by {baselineSim.metrics.total_dep_delay_mins - m.total_dep_delay_mins} mins; {baselineSim.metrics.stranded_passengers - m.stranded_passengers} stranded passengers saved.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('comparison')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-aviation-cyan text-slate-950 font-bold hover:bg-cyan-300 transition"
          >
            <span>View Comparison</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        {/* Card 1: Delayed Flights */}
        <div className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Delayed Flights</span>
            <AlertTriangle className={`w-4 h-4 ${m.delayed_flights > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{m.delayed_flights}</span>
            <span className="text-xs text-slate-500 font-normal">/ {m.total_flights} total</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {m.on_time_flights} on-time ({Math.round((m.on_time_flights / m.total_flights) * 100)}%)
          </div>
        </div>

        {/* Card 2: Total Delay Minutes */}
        <div className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Delay Mins</span>
            <Clock className={`w-4 h-4 ${m.total_dep_delay_mins > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {m.total_dep_delay_mins}m
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg {m.avg_delay_mins}m per delayed leg
          </div>
        </div>

        {/* Card 3: Stranded Passengers */}
        <div className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Stranded Pax</span>
            <Users className={`w-4 h-4 ${m.stranded_passengers > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-bold text-white">
            {m.stranded_passengers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {m.missed_connections} broken connections
          </div>
        </div>

        {/* Card 4: Crew Violations */}
        <div className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Crew Violations</span>
            <UserCheck className={`w-4 h-4 ${m.crew_violations > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${m.crew_violations > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {m.crew_violations}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            &gt;600m legal duty limit
          </div>
        </div>

        {/* Card 5: Affected Aircraft */}
        <div className="glass-panel p-3.5 rounded-xl border border-aviation-cardBorder col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Affected Aircraft</span>
            <Plane className="w-4 h-4 text-aviation-cyan" />
          </div>
          <div className="text-2xl font-bold text-white">
            {m.affected_aircraft} <span className="text-xs text-slate-500 font-normal">/ 16 tails</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {16 - m.affected_aircraft} rotations nominal
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Map + Side Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Radar Map */}
        <div className="lg:col-span-2 flex flex-col space-y-3">
          <NetworkMap />
          <TimelineReplay />
        </div>

        {/* Right 1 Col: AI Dispatcher Teaser & Hourly Delay Chart */}
        <div className="space-y-4 font-mono">
          {/* AI Dispatcher Card */}
          <div className="glass-panel-glow p-4 rounded-xl border border-aviation-cyan/30 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-aviation-cyan" />
                <span className="font-bold text-sm text-aviation-cyan">AI DISPATCHER COPILOT</span>
              </div>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-aviation-cyan/20 text-aviation-cyan">
                {recommendations.length} Active Proposals
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Deterministic recovery candidate generator has evaluated candidate mitigation actions against all 16 airport rotations and crew legality constraints.
            </p>
            {recommendations.length > 0 ? (
              <div className="space-y-2 mb-3">
                <div className="p-2.5 rounded-lg bg-aviation-darkest border border-slate-700 text-xs">
                  <div className="text-aviation-cyan font-semibold flex items-center justify-between">
                    <span>Rank #1: {recommendations[0].title}</span>
                    <span className="text-emerald-400 text-[11px]">-{recommendations[0].predictedImpact.delayReductionMins}m delay</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                    {recommendations[0].summary}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('dispatcher')}
                  className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs transition"
                >
                  <span>Review AI Recovery Dispatcher</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Network operating nominally. No recovery interventions required.</span>
              </div>
            )}
          </div>

          {/* Hourly Delay Waveform Chart */}
          <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-300">
              <span className="font-bold">HOURLY DELAY PROPAGATION (MINS)</span>
              <span className="text-[11px] text-slate-500">24H Profile</span>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2d4a" vertical={false} />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0c1322', borderColor: '#1c2d4a', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="delayMins" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Delay Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab('dna')}
              className="p-2.5 rounded-lg bg-aviation-card hover:bg-slate-800 border border-aviation-cardBorder text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <span>Delay DNA</span>
              <ArrowRight className="w-3.5 h-3.5 text-aviation-cyan" />
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className="p-2.5 rounded-lg bg-aviation-card hover:bg-slate-800 border border-aviation-cardBorder text-slate-200 flex items-center justify-center gap-1.5 transition"
            >
              <span>Simulate Disruption</span>
              <ArrowRight className="w-3.5 h-3.5 text-aviation-cyan" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
