'use client';

import React from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { 
  Activity, 
  Radar, 
  AlertOctagon, 
  PlaneTakeoff, 
  GitFork, 
  Users, 
  UserCheck, 
  Bot, 
  Sliders, 
  BarChart3, 
  Database, 
  Settings,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export default function Sidebar() {
  const { activeTab, setActiveTab, currentSim, recommendations } = useSimulation();

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Operations Overview', icon: Activity },
    { id: 'network', label: 'Airport Network Radar', icon: Radar },
    { 
      id: 'simulator', 
      label: 'Disruption Simulator', 
      icon: AlertOctagon,
      badge: currentSim.metrics.delayed_flights > 0 ? `${currentSim.metrics.delayed_flights} dly` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    { id: 'flights', label: 'Flight Operations', icon: PlaneTakeoff },
    { id: 'dna', label: 'Delay DNA Explorer', icon: GitFork },
    { 
      id: 'passengers', 
      label: 'Passenger Impact', 
      icon: Users,
      badge: currentSim.metrics.stranded_passengers > 0 ? `${currentSim.metrics.stranded_passengers} pax` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
    },
    { 
      id: 'crew', 
      label: 'Crew Management', 
      icon: UserCheck,
      badge: currentSim.metrics.crew_violations > 0 ? `${currentSim.metrics.crew_violations} alert` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
    },
    { 
      id: 'dispatcher', 
      label: 'AI Dispatcher', 
      icon: Bot,
      badge: recommendations.length > 0 ? `${recommendations.length} recs` : undefined,
      badgeColor: 'bg-aviation-cyan/20 text-aviation-cyan border border-aviation-cyan/30'
    },
    { id: 'recovery', label: 'Recovery Sandbox', icon: Sliders },
    { id: 'comparison', label: 'Scenario Comparison', icon: BarChart3 },
    { id: 'dataset', label: 'Dataset Information', icon: Database },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-aviation-dark border-r border-aviation-cardBorder flex flex-col shrink-0 min-h-[calc(100vh-57px)]">
      <div className="p-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 border-b border-aviation-cardBorder/60">
        Navigation Modules
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all text-left group ${
                isActive
                  ? 'bg-aviation-card border border-aviation-cyan/40 text-white font-semibold shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 transition ${isActive ? 'text-aviation-cyan' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                {item.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-aviation-cyan" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Operational Summary Mini Card */}
      <div className="p-3 m-2 rounded-lg bg-aviation-darkest border border-aviation-cardBorder font-mono text-[11px]">
        <div className="text-slate-400 mb-1 flex items-center justify-between">
          <span>Active Scenario</span>
          <span className="text-aviation-cyan font-bold">{currentSim.disruption.airportId || 'NOMINAL'}</span>
        </div>
        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Delay Mins:</span>
            <span className={currentSim.metrics.total_dep_delay_mins > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {currentSim.metrics.total_dep_delay_mins}m
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Stranded Pax:</span>
            <span className={currentSim.metrics.stranded_passengers > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {currentSim.metrics.stranded_passengers}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Crew Alerts:</span>
            <span className={currentSim.metrics.crew_violations > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {currentSim.metrics.crew_violations}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
