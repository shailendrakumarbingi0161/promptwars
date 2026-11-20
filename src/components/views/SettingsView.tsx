'use client';

import React from 'react';
import { Settings, ShieldCheck, CheckCircle2, Cpu, Radio, Github, ExternalLink } from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="space-y-4 font-mono text-white text-xs max-w-4xl">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-aviation-cardBorder flex items-center justify-between">
        <div className="flex items-center space-x-2 text-aviation-cyan">
          <Settings className="w-5 h-5 text-aviation-cyan" />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">SYSTEM & OPERATIONS CONFIGURATION</h2>
            <p className="text-slate-400 text-xs">Aviation rule constraints and environment parameters.</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-aviation-cyan/20 text-aviation-cyan text-xs font-bold border border-aviation-cyan/30">
          PROMPT WAR 2026 EDITION
        </span>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Operational Rules */}
        <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-3">
          <div className="text-aviation-cyan font-bold border-b border-slate-700 pb-2">
            OPERATIONAL RULE CONSTRAINTS
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between items-center p-2 rounded bg-aviation-darkest border border-slate-800">
              <span>Minimum Aircraft Turnaround</span>
              <span className="font-bold text-white">30 Minutes</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-aviation-darkest border border-slate-800">
              <span>Maximum Legal Crew Duty</span>
              <span className="font-bold text-white">600 Minutes (10.0h)</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-aviation-darkest border border-slate-800">
              <span>Ground Delay Policy</span>
              <span className="font-bold text-white">FAA/DGCA Ground Delay Program</span>
            </div>
            <div className="flex justify-between items-center p-2 rounded bg-aviation-darkest border border-slate-800">
              <span>Aircraft Standard Capacity</span>
              <span className="font-bold text-white">180 Seats (All Fleet)</span>
            </div>
          </div>
        </div>

        {/* Card 2: AI Engine Architecture */}
        <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-3">
          <div className="text-aviation-cyan font-bold border-b border-slate-700 pb-2 flex items-center justify-between">
            <span>AI DISPATCHER ARCHITECTURE</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              DEMO READY
            </span>
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="p-2.5 rounded bg-aviation-darkest border border-slate-800 text-[11px] leading-relaxed">
              <strong className="text-aviation-cyan">Deterministic Calculation Core:</strong> The AI Dispatcher generates, evaluates, and ranks candidate actions through the deterministic simulation engine. No simulated values are hallucinated or fabricated.
            </div>
            <div className="p-2.5 rounded bg-aviation-darkest border border-slate-800 text-[11px] leading-relaxed">
              <strong className="text-aviation-cyan">Standalone Offline Mode:</strong> Fully operational without external API keys or cloud dependencies, meeting all competition security and offline testing guidelines.
            </div>
          </div>
        </div>

        {/* Card 3: Competition Metadata */}
        <div className="glass-panel p-5 rounded-xl border border-aviation-cardBorder space-y-3 md:col-span-2">
          <div className="text-aviation-cyan font-bold border-b border-slate-700 pb-2">
            REPOSITORY & DEPLOYMENT TELEMETRY
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
            <div className="p-2.5 rounded bg-aviation-darkest border border-slate-800">
              <div className="text-slate-500 text-[10px]">GitHub Username</div>
              <div className="font-bold text-white mt-0.5">shailendrakumarbingi0161</div>
            </div>
            <div className="p-2.5 rounded bg-aviation-darkest border border-slate-800">
              <div className="text-slate-500 text-[10px]">Repository Name</div>
              <div className="font-bold text-white mt-0.5">domino-sky</div>
            </div>
            <div className="p-2.5 rounded bg-aviation-darkest border border-slate-800">
              <div className="text-slate-500 text-[10px]">Target Deployment</div>
              <div className="font-bold text-aviation-cyan mt-0.5">Vercel Production</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
