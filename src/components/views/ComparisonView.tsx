'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface MetricRow {
  label: string;
  original: number;
  recovered: number;
  unit?: string;
  lowerIsBetter: boolean;
}

export default function ComparisonView() {
  const { baselineSim, recoveredSim, activeRecovery, clearRecoveryAction, setActiveTab } = useSimulation();

  const b = baselineSim.metrics;
  const r = recoveredSim ? recoveredSim.metrics : b;

  const metricsList: MetricRow[] = [
    { label: 'Delayed Flights', original: b.delayed_flights, recovered: r.delayed_flights, lowerIsBetter: true },
    { label: 'Total Departure Delay Minutes', original: b.total_dep_delay_mins, recovered: r.total_dep_delay_mins, unit: 'm', lowerIsBetter: true },
    { label: 'Total Arrival Delay Minutes', original: b.total_arr_delay_mins, recovered: r.total_arr_delay_mins, unit: 'm', lowerIsBetter: true },
    { label: 'Average Delay Per Affected Leg', original: b.avg_delay_mins, recovered: r.avg_delay_mins, unit: 'm', lowerIsBetter: true },
    { label: 'Maximum Single Flight Delay', original: b.max_delay_mins, recovered: r.max_delay_mins, unit: 'm', lowerIsBetter: true },
    { label: 'Affected Aircraft Rotations', original: b.affected_aircraft, recovered: r.affected_aircraft, lowerIsBetter: true },
    { label: 'Cancelled Flights', original: b.cancelled_flights, recovered: r.cancelled_flights, lowerIsBetter: true },
    { label: 'Missed Connections', original: b.missed_connections, recovered: r.missed_connections, lowerIsBetter: true },
    { label: 'Stranded Passengers', original: b.stranded_passengers, recovered: r.stranded_passengers, lowerIsBetter: true },
    { label: 'Crew Legal Duty Violations', original: b.crew_violations, recovered: r.crew_violations, lowerIsBetter: true },
    { label: 'Flights Operationally Recovered', original: b.recovered_flights, recovered: r.recovered_flights, lowerIsBetter: false },
  ];

  const calcImprovement = (orig: number, rec: number, lowerIsBetter: boolean) => {
    if (lowerIsBetter) {
      const imp = orig - rec;
      const pct = orig > 0 ? ((imp / orig) * 100).toFixed(1) : '0.0';
      return { diff: imp, pct: Number(pct), isPositive: imp >= 0 };
    } else {
      const imp = rec - orig;
      const pct = orig > 0 ? ((imp / orig) * 100).toFixed(1) : '0.0';
      return { diff: imp, pct: Number(pct), isPositive: imp >= 0 };
    }
  };

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <BarChart3 className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">BEFORE-AND-AFTER OPERATIONAL COMPARISON</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifiable comparative intelligence: Baseline Disruption Scenario vs Recovered Strategy. All values calculated by the deterministic engine.
          </p>
        </div>

        {activeRecovery ? (
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-aviation-cyan font-bold bg-aviation-cyan/10 border border-aviation-cyan/30 px-2 py-1 rounded">
              Active Strategy: {activeRecovery.type}
            </span>
            <button
              onClick={clearRecoveryAction}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Revert
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveTab('dispatcher')}
            className="px-3 py-1.5 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold transition flex items-center gap-1.5"
          >
            <span>Select AI Recovery Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Comparative Metrics Table */}
      <div className="glass-panel rounded-xl border border-aviation-cardBorder overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-aviation-darkest/90 text-slate-400 border-b border-aviation-cardBorder text-[11px]">
              <tr>
                <th className="py-3 px-4">OPERATIONAL METRIC</th>
                <th className="py-3 px-4 text-rose-400 font-bold">ORIGINAL DISRUPTION</th>
                <th className="py-3 px-4 text-aviation-cyan font-bold">RECOVERED OPERATION</th>
                <th className="py-3 px-4 text-emerald-400 font-bold">ABSOLUTE DELTA</th>
                <th className="py-3 px-4 text-right">PERCENT IMPROVEMENT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metricsList.map((m, idx) => {
                const { diff, pct, isPositive } = calcImprovement(m.original, m.recovered, m.lowerIsBetter);
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-white">{m.label}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {m.original}{m.unit || ''}
                    </td>
                    <td className="py-3 px-4 text-aviation-cyan font-bold">
                      {m.recovered}{m.unit || ''}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <span className={diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {diff > 0 ? `-${diff}` : diff < 0 ? `+${Math.abs(diff)}` : '0'}{m.unit || ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.original > 0 && diff !== 0 ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          isPositive 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isPositive ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          <span>{isPositive ? `+${pct}%` : `${pct}%`}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">--</span>
                      )}
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
