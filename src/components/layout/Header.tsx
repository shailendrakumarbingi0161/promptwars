'use client';

import React, { useState } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { minsToTime } from '@/lib/timeUtils';
import { toggleSound, isSoundEnabled, playRadarBlip } from '@/lib/soundEffects';
import { 
  Radio, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RotateCcw, 
  Play, 
  Pause, 
  Zap, 
  Github,
  Plane,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function Header() {
  const { 
    currentSim, 
    baselineSim,
    recoveredSim,
    isRecoveryMode, 
    setIsRecoveryMode, 
    activeRecovery,
    replayTimeMins,
    isPlaying,
    setIsPlaying,
    resetAll,
    loadPreset
  } = useSimulation();

  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
    if (next) playRadarBlip();
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-aviation-cardBorder px-4 py-2.5 flex items-center justify-between text-white">
      {/* Brand & Status */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-aviation-dark border border-aviation-cyan/30 text-aviation-cyan shadow-glow-cyan">
          <Plane className="w-5 h-5 transform -rotate-45" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-aviation-cyan animate-ping" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-black tracking-wider text-base text-white">DOMINO SKY</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-aviation-cyan/10 text-aviation-cyan border border-aviation-cyan/30">
              Ops Center v2.6
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            16 Airports • 70 Flights • Deterministic Engine
          </p>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div className="hidden lg:flex items-center space-x-2">
        <span className="text-xs font-mono text-slate-400">Presets:</span>
        <button 
          onClick={() => {
            loadPreset('delhi_fog');
            playRadarBlip();
          }}
          className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800/80 hover:bg-aviation-cyan/20 hover:text-aviation-cyan border border-slate-700 transition"
        >
          DEL Morning Fog (+120m)
        </button>
        <button 
          onClick={() => {
            loadPreset('mumbai_monsoon');
            playRadarBlip();
          }}
          className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800/80 hover:bg-aviation-cyan/20 hover:text-aviation-cyan border border-slate-700 transition"
        >
          BOM Monsoon Storm (+150m)
        </button>
        <button 
          onClick={() => {
            loadPreset('bengaluru_tech');
            playRadarBlip();
          }}
          className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800/80 hover:bg-aviation-cyan/20 hover:text-aviation-cyan border border-slate-700 transition"
        >
          BLR Runway Hold (+90m)
        </button>
      </div>

      {/* Telemetry & Mode Switch */}
      <div className="flex items-center space-x-2.5">
        {/* Scenario Mode Indicator */}
        {recoveredSim && (
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => {
                setIsRecoveryMode(false);
                playRadarBlip();
              }}
              className={`px-2.5 py-1 rounded-md transition ${!isRecoveryMode ? 'bg-aviation-rose text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              Disrupted
            </button>
            <button
              onClick={() => {
                setIsRecoveryMode(true);
                playRadarBlip();
              }}
              className={`px-2.5 py-1 rounded-md transition ${isRecoveryMode ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Recovered
            </button>
          </div>
        )}

        {/* Live Replay Time indicator */}
        <div className="flex items-center space-x-2 bg-aviation-dark px-3 py-1.5 rounded-lg border border-aviation-cardBorder font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-aviation-cyan" />
          <span className="text-slate-300">SIM TIME:</span>
          <span className="font-bold text-aviation-cyan text-sm">{minsToTime(replayTimeMins)}</span>
          <span className="text-[10px] text-slate-500">IST</span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="ml-1 p-1 rounded hover:bg-slate-700 text-slate-300 transition"
            title={isPlaying ? 'Pause Replay' : 'Play Replay'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        </div>

        {/* Sound FX Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded-lg border text-xs transition ${
            soundOn 
              ? 'bg-aviation-cyan/10 border-aviation-cyan/30 text-aviation-cyan' 
              : 'bg-aviation-dark border-aviation-cardBorder text-slate-500 hover:text-slate-300'
          }`}
          title={soundOn ? 'ATC Sound FX Enabled' : 'ATC Sound FX Muted'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset button */}
        <button
          onClick={resetAll}
          className="p-1.5 rounded-lg bg-aviation-dark hover:bg-slate-800 border border-aviation-cardBorder text-slate-400 hover:text-white transition"
          title="Reset Simulation Scenario"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com/shailendrakumarbingi0161/domino-sky"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-aviation-dark hover:bg-slate-800 border border-aviation-cardBorder text-xs font-mono text-slate-300 transition"
        >
          <Github className="w-3.5 h-3.5" />
          <span>v1.0</span>
        </a>
      </div>
    </header>
  );
}
