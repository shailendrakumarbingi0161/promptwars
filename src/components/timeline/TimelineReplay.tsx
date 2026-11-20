'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { minsToTime } from '@/lib/timeUtils';
import { Play, Pause, RotateCcw, FastForward, Clock, AlertCircle } from 'lucide-react';

export default function TimelineReplay() {
  const { 
    replayTimeMins, 
    setReplayTimeMins, 
    isPlaying, 
    setIsPlaying, 
    playbackSpeed, 
    setPlaybackSpeed,
    currentSim
  } = useSimulation();

  // Range from 05:00 (300m) to 22:00 (1320m)
  const minTime = 300;
  const maxTime = 1320;

  // Active event near current time
  const currentEvents = currentSim.eventsChronological.filter(
    e => Math.abs(e.timeMins - replayTimeMins) <= 15
  );

  return (
    <div className="glass-panel p-3 rounded-xl border border-aviation-cardBorder text-white font-mono">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-aviation-cyan/20 hover:bg-aviation-cyan/30 text-aviation-cyan border border-aviation-cyan/40 text-xs font-bold transition shadow-glow-cyan"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>PLAY REPLAY</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setReplayTimeMins(480);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset to 08:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            {[1, 2, 5, 10].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 rounded transition ${playbackSpeed === speed ? 'bg-aviation-cyan text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Current Time Display */}
        <div className="flex items-center space-x-2 text-xs">
          <Clock className="w-4 h-4 text-aviation-cyan" />
          <span className="text-slate-400">Current Timeline Point:</span>
          <span className="text-base font-bold text-aviation-cyan">{minsToTime(replayTimeMins)} IST</span>
        </div>
      </div>

      {/* Scrubbing Slider */}
      <div className="relative w-full pt-1 pb-2">
        <input
          type="range"
          min={minTime}
          max={maxTime}
          step={5}
          value={replayTimeMins}
          onChange={(e) => setReplayTimeMins(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-aviation-cyan"
        />
        <div className="flex justify-between text-[10px] text-slate-500 pt-1">
          <span>05:00 Morning Ops</span>
          <span>09:00 Hub Peak</span>
          <span>13:00 Midday Wave</span>
          <span>17:00 Evening Rush</span>
          <span>22:00 Night Turnaround</span>
        </div>
      </div>

      {/* Live Event Sniffer */}
      {currentEvents.length > 0 && (
        <div className="mt-1 pt-2 border-t border-slate-800 flex items-center space-x-2 text-xs text-amber-300 overflow-x-auto whitespace-nowrap">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-pulse" />
          <span className="text-slate-400">Chronological Event:</span>
          <span className="font-semibold text-white">[{currentEvents[0].timeStr}] {currentEvents[0].title}</span>
          <span className="text-slate-400 text-[11px]">— {currentEvents[0].description}</span>
        </div>
      )}
    </div>
  );
}
