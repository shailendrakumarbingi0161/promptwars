'use client';

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  DisruptionInput, 
  RecoveryAction, 
  SimulationResult, 
  AIDispatcherRecommendation 
} from '@/types';
import { runFullSimulation } from '@/engine/simulationMaster';
import { generateRecoveryCandidates } from '@/engine/aiDispatcher';

interface SimulationContextType {
  disruption: DisruptionInput;
  setDisruption: (d: DisruptionInput) => void;
  activeRecovery: RecoveryAction | null;
  setActiveRecovery: (r: RecoveryAction | null) => void;
  baselineSim: SimulationResult;
  recoveredSim: SimulationResult | null;
  currentSim: SimulationResult;
  isRecoveryMode: boolean;
  setIsRecoveryMode: (val: boolean) => void;
  recommendations: AIDispatcherRecommendation[];
  selectedFlightId: string | null;
  setSelectedFlightId: (fid: string | null) => void;
  selectedAirportId: string | null;
  setSelectedAirportId: (aid: string | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  replayTimeMins: number;
  setReplayTimeMins: (m: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (s: number) => void;
  applyRecoveryAction: (action: RecoveryAction) => void;
  clearRecoveryAction: () => void;
  resetAll: () => void;
  loadPreset: (presetKey: string) => void;
}

const defaultDisruption: DisruptionInput = {
  airportId: 'DEL',
  startTime: '08:00',
  durationMins: 90
};

const SimulationContext = createContext<SimulationContextType | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [disruption, setDisruption] = useState<DisruptionInput>(defaultDisruption);
  const [activeRecovery, setActiveRecovery] = useState<RecoveryAction | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(false);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>('DS0101');
  const [selectedAirportId, setSelectedAirportId] = useState<string | null>('DEL');
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Replay timeline state (default 08:00 = 480 mins)
  const [replayTimeMins, setReplayTimeMins] = useState<number>(480);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Compute baseline simulation (disrupted, no recovery)
  const baselineSim = useMemo(() => {
    return runFullSimulation(disruption, null, 'baseline_scenario');
  }, [disruption]);

  // Compute recovered simulation (if recovery is active)
  const recoveredSim = useMemo(() => {
    if (!activeRecovery) return null;
    return runFullSimulation(disruption, activeRecovery, 'recovered_scenario');
  }, [disruption, activeRecovery]);

  // Compute AI Dispatcher recommendations based on baseline
  const recommendations = useMemo(() => {
    return generateRecoveryCandidates(baselineSim);
  }, [baselineSim]);

  // Current active simulation based on view toggle
  const currentSim = useMemo(() => {
    if (isRecoveryMode && recoveredSim) {
      return recoveredSim;
    }
    return baselineSim;
  }, [isRecoveryMode, recoveredSim, baselineSim]);

  // Replay playback ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setReplayTimeMins((prev) => {
        if (prev >= 1320) { // 22:00
          setIsPlaying(false);
          return 1320;
        }
        return prev + 5; // step 5 mins
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const applyRecoveryAction = useCallback((action: RecoveryAction) => {
    setActiveRecovery(action);
    setIsRecoveryMode(true);
  }, []);

  const clearRecoveryAction = useCallback(() => {
    setActiveRecovery(null);
    setIsRecoveryMode(false);
  }, []);

  const resetAll = useCallback(() => {
    setDisruption({
      airportId: 'DEL',
      startTime: '08:00',
      durationMins: 90
    });
    setActiveRecovery(null);
    setIsRecoveryMode(false);
    setSelectedFlightId('DS0101');
    setSelectedAirportId('DEL');
    setReplayTimeMins(480);
    setIsPlaying(false);
  }, []);

  const loadPreset = useCallback((presetKey: string) => {
    if (presetKey === 'delhi_fog') {
      setDisruption({ airportId: 'DEL', startTime: '08:00', durationMins: 120 });
      setSelectedAirportId('DEL');
      setSelectedFlightId('DS0101');
      setReplayTimeMins(480);
    } else if (presetKey === 'mumbai_monsoon') {
      setDisruption({ airportId: 'BOM', startTime: '07:30', durationMins: 150 });
      setSelectedAirportId('BOM');
      setSelectedFlightId('DS0201');
      setReplayTimeMins(450);
    } else if (presetKey === 'bengaluru_tech') {
      setDisruption({ airportId: 'BLR', startTime: '11:00', durationMins: 90 });
      setSelectedAirportId('BLR');
      setSelectedFlightId('DS0502');
      setReplayTimeMins(660);
    } else if (presetKey === 'hyderabad_hub') {
      setDisruption({ airportId: 'HYD', startTime: '12:00', durationMins: 90 });
      setSelectedAirportId('HYD');
      setSelectedFlightId('DS0703');
      setReplayTimeMins(720);
    }
    setActiveRecovery(null);
    setIsRecoveryMode(false);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        disruption,
        setDisruption,
        activeRecovery,
        setActiveRecovery,
        baselineSim,
        recoveredSim,
        currentSim,
        isRecoveryMode,
        setIsRecoveryMode,
        recommendations,
        selectedFlightId,
        setSelectedFlightId,
        selectedAirportId,
        setSelectedAirportId,
        activeTab,
        setActiveTab,
        replayTimeMins,
        setReplayTimeMins,
        isPlaying,
        setIsPlaying,
        playbackSpeed,
        setPlaybackSpeed,
        applyRecoveryAction,
        clearRecoveryAction,
        resetAll,
        loadPreset
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
