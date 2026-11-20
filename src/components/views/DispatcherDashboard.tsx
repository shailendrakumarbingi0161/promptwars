'use client';

import React, { useState } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { 
  Bot, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RotateCcw,
  Plane,
  Zap
} from 'lucide-react';

export default function DispatcherDashboard() {
  const { 
    recommendations, 
    applyRecoveryAction, 
    activeRecovery, 
    clearRecoveryAction, 
    isRecoveryMode,
    baselineSim,
    setActiveTab 
  } = useSimulation();

  const [selectedRecId, setSelectedRecId] = useState<string | null>(
    recommendations.length > 0 ? recommendations[0].id : null
  );

  const selectedRec = recommendations.find(r => r.id === selectedRecId) || recommendations[0];

  return (
    <div className="space-y-4 font-mono text-white text-xs">
      {/* Header Banner */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cyan/40 shadow-glow-cyan flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-aviation-cyan">
            <Bot className="w-5 h-5 text-aviation-cyan" />
            <h2 className="text-base font-bold text-white tracking-wide">AI DISPATCHER RECOVERY DECISION-SUPPORT</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic candidate evaluation with strict numerical integrity. All recommendations are pre-simulated and verified against station, turnaround, and crew constraints.
          </p>
        </div>

        {activeRecovery ? (
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-aviation-cyan bg-aviation-cyan/10 px-2 py-1 rounded border border-aviation-cyan/30 font-bold">
              Recovery Action Active
            </span>
            <button
              onClick={clearRecoveryAction}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert to Baseline</span>
            </button>
          </div>
        ) : (
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Engine Active</span>
          </div>
        )}
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Ranked Candidates List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Ranked Recovery Proposals ({recommendations.length})
            </div>
            {recommendations.map((rec) => {
              const isSelected = selectedRec?.id === rec.id;
              const isApplied = activeRecovery?.type === rec.action.type && 
                (activeRecovery?.flightToReplaceId === rec.action.flightToReplaceId || activeRecovery?.flightToCancelId === rec.action.flightToCancelId);

              return (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecId(rec.id)}
                  className={`p-3.5 rounded-xl glass-panel border cursor-pointer transition space-y-2 ${
                    isSelected 
                      ? 'border-aviation-cyan/60 bg-aviation-card shadow-glow-cyan' 
                      : 'border-aviation-cardBorder hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/40">
                      RANK #{rec.rank} • {rec.strategy}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      -{rec.predictedImpact.delayReductionMins}m Delay
                    </span>
                  </div>

                  <div className="font-bold text-sm text-white">{rec.title}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{rec.summary}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span>Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                    {rec.predictedImpact.paxSaved > 0 && (
                      <span className="text-amber-400 font-semibold">+{rec.predictedImpact.paxSaved} Pax Saved</span>
                    )}
                    {isApplied && (
                      <span className="text-cyan-400 font-bold">● DEPLOYED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 2 Columns: Detailed Recovery Inspection Deck */}
          {selectedRec && (
            <div className="lg:col-span-2 glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-white">{selectedRec.title}</span>
                  </div>
                  <span className="text-slate-400 text-xs">Strategy Category: {selectedRec.strategy}</span>
                </div>
                <button
                  onClick={() => {
                    applyRecoveryAction(selectedRec.action);
                    setActiveTab('comparison');
                  }}
                  className="px-4 py-2 rounded-lg bg-aviation-cyan hover:bg-cyan-300 text-slate-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-glow-cyan"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>DEPLOY THIS RECOVERY ACTION</span>
                </button>
              </div>

              {/* Verified Quantitative Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Systemic Delay Saved</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    -{selectedRec.predictedImpact.delayReductionMins} mins
                  </div>
                  <div className="text-[10px] text-slate-500">From {baselineSim.metrics.total_dep_delay_mins}m total</div>
                </div>
                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Stranded Pax Protected</div>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">
                    +{selectedRec.predictedImpact.paxSaved} pax
                  </div>
                  <div className="text-[10px] text-slate-500">Connections preserved</div>
                </div>
                <div className="p-3 rounded-lg bg-aviation-darkest border border-slate-800">
                  <div className="text-slate-500 text-[10px]">Crew Violations Avoided</div>
                  <div className="text-xl font-bold text-aviation-cyan mt-0.5">
                    +{selectedRec.predictedImpact.crewViolationsAvoided} crews
                  </div>
                  <div className="text-[10px] text-slate-500">Below 600m legal limit</div>
                </div>
              </div>

              {/* Rationale & Operational Logic */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-aviation-cyan">OPERATIONAL RATIONALE</div>
                <p className="p-3 rounded-lg bg-aviation-darkest border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {selectedRec.rationale}
                </p>
              </div>

              {/* Operational Trade-offs & Risks */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400">OPERATIONAL TRADE-OFFS & CONSTRAINTS</div>
                <ul className="space-y-1.5">
                  {selectedRec.tradeOffs.map((trade, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <span className="text-aviation-cyan font-bold">•</span>
                      <span>{trade}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Constraints Verification Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400">DETERMINISTIC CONSTRAINTS VERIFICATION</div>
                <div className="space-y-1.5">
                  {selectedRec.constraintsChecked.map((chk, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-aviation-darkest border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {chk.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-semibold text-white">{chk.rule}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{chk.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-10 rounded-xl border border-aviation-cardBorder text-center text-slate-400 text-xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="font-bold text-white text-sm">No Recovery Interventions Required</p>
          <p className="text-slate-500">Current network schedule is fully on-time. Simulate an airport disruption to activate recovery proposals.</p>
        </div>
      )}
    </div>
  );
}
