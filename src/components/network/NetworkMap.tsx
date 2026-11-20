'use client';

import React, { useState, useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { AUTHORITATIVE_DATASET, AIRPORTS_MAP } from '@/data/authoritativeDataset';
import { Airport, FlightSimResult } from '@/types';
import { Plane, AlertTriangle, ShieldCheck, MapPin, Radio, Compass } from 'lucide-react';

export default function NetworkMap() {
  const { 
    currentSim, 
    selectedAirportId, 
    setSelectedAirportId, 
    setSelectedFlightId, 
    replayTimeMins,
    disruption 
  } = useSimulation();

  const [hoveredAirport, setHoveredAirport] = useState<Airport | null>(null);

  // Geographic projection bounds for India
  const width = 800;
  const height = 750;
  const paddingX = 70;
  const paddingY = 60;
  const minLng = 71.0;
  const maxLng = 93.0;
  const minLat = 7.5;
  const maxLat = 32.0;

  const project = (lat: number, lng: number) => {
    const x = paddingX + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * paddingX);
    const y = height - paddingY - ((lat - minLat) / (maxLat - minLat)) * (height - 2 * paddingY);
    return { x, y };
  };

  // Pre-calculate positions
  const airportCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number; airport: Airport }> = {};
    for (const a of AUTHORITATIVE_DATASET.airports) {
      coords[a.id] = { ...project(a.lat, a.lng), airport: a };
    }
    return coords;
  }, []);

  // Compute unique airport pairs (routes) and determine status
  const routes = useMemo(() => {
    const pairMap = new Map<string, { from: Airport; to: Airport; maxDelay: number; flights: FlightSimResult[] }>();

    for (const f of currentSim.flightList) {
      const origin = AIRPORTS_MAP.get(f.origin);
      const dest = AIRPORTS_MAP.get(f.destination);
      if (!origin || !dest) continue;

      const key = [f.origin, f.destination].sort().join('-');
      if (!pairMap.has(key)) {
        pairMap.set(key, { from: origin, to: dest, maxDelay: 0, flights: [] });
      }
      const item = pairMap.get(key)!;
      item.flights.push(f);
      if (f.dep_delay_mins > item.maxDelay) item.maxDelay = f.dep_delay_mins;
      if (f.arr_delay_mins > item.maxDelay) item.maxDelay = f.arr_delay_mins;
    }

    return Array.from(pairMap.values());
  }, [currentSim]);

  // Compute active airborne flights at replayTimeMins
  const activeAirborneFlights = useMemo(() => {
    return currentSim.flightList.filter(f => {
      if (f.is_cancelled) return false;
      return replayTimeMins >= f.sim_dep_mins && replayTimeMins <= f.sim_arr_mins;
    });
  }, [currentSim, replayTimeMins]);

  return (
    <div className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center bg-aviation-darkest/90 rounded-xl border border-aviation-cardBorder overflow-hidden select-none">
      {/* HUD Radar Overlay Header */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 text-xs font-mono text-aviation-cyan">
        <Compass className="w-4 h-4 animate-spin text-aviation-cyan/70" style={{ animationDuration: '20s' }} />
        <span>AIRSPACE RADAR TRACKER // INDIA SUB-CONTINENT</span>
      </div>

      <div className="absolute top-3 right-4 z-10 flex items-center space-x-4 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-400">On Time</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-400">Minor Delay (&lt;60m)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-400">Severe / Closed</span>
        </div>
      </div>

      {/* Main SVG Radar Map */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[850px] h-auto drop-shadow-2xl"
      >
        <defs>
          <radialGradient id="radarGrid" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Radar concentric background circles */}
        <circle cx={width / 2} cy={height / 2} r={320} fill="none" stroke="#1c2d4a" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        <circle cx={width / 2} cy={height / 2} r={220} fill="none" stroke="#1c2d4a" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        <circle cx={width / 2} cy={height / 2} r={120} fill="none" stroke="#1c2d4a" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
        
        {/* Radar crosshairs */}
        <line x1={width / 2} y1={20} x2={width / 2} y2={height - 20} stroke="#1c2d4a" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 4" />
        <line x1={20} y1={height / 2} x2={width - 20} y2={height / 2} stroke="#1c2d4a" strokeWidth="0.8" opacity="0.3" strokeDasharray="2 4" />

        {/* Flight Routes (Curved Arcs) */}
        {routes.map((route, idx) => {
          const fromCoord = airportCoords[route.from.id];
          const toCoord = airportCoords[route.to.id];
          if (!fromCoord || !toCoord) return null;

          // Compute midpoint with slight curve
          const midX = (fromCoord.x + toCoord.x) / 2;
          const midY = (fromCoord.y + toCoord.y) / 2;
          const dx = toCoord.x - fromCoord.x;
          const dy = toCoord.y - fromCoord.y;
          // Curve perpendicular
          const curvature = 0.12;
          const ctrlX = midX - dy * curvature;
          const ctrlY = midY + dx * curvature;

          const isClosedOrigin = disruption?.airportId === route.from.id;
          const isClosedDest = disruption?.airportId === route.to.id;

          let strokeColor = '#10b981'; // green
          let strokeOpacity = 0.35;
          let strokeWidth = 1.5;

          if (isClosedOrigin || isClosedDest || route.maxDelay >= 60) {
            strokeColor = '#f43f5e'; // red
            strokeOpacity = 0.7;
            strokeWidth = 2.2;
          } else if (route.maxDelay > 0) {
            strokeColor = '#f59e0b'; // amber
            strokeOpacity = 0.55;
            strokeWidth = 1.8;
          }

          return (
            <g key={`route-${idx}`}>
              <path
                d={`M ${fromCoord.x} ${fromCoord.y} Q ${ctrlX} ${ctrlY} ${toCoord.x} ${toCoord.y}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Active Airborne Aircraft Movement */}
        {activeAirborneFlights.map(f => {
          const fromCoord = airportCoords[f.origin];
          const toCoord = airportCoords[f.destination];
          if (!fromCoord || !toCoord) return null;

          const duration = f.sim_arr_mins - f.sim_dep_mins;
          const progress = duration > 0 ? (replayTimeMins - f.sim_dep_mins) / duration : 0;
          const clampedProgress = Math.max(0, Math.min(1, progress));

          // Interpolate along curve
          const midX = (fromCoord.x + toCoord.x) / 2;
          const midY = (fromCoord.y + toCoord.y) / 2;
          const dx = toCoord.x - fromCoord.x;
          const dy = toCoord.y - fromCoord.y;
          const curvature = 0.12;
          const ctrlX = midX - dy * curvature;
          const ctrlY = midY + dx * curvature;

          // Bezier point calculation
          const t = clampedProgress;
          const curX = (1 - t) * (1 - t) * fromCoord.x + 2 * (1 - t) * t * ctrlX + t * t * toCoord.x;
          const curY = (1 - t) * (1 - t) * fromCoord.y + 2 * (1 - t) * t * ctrlY + t * t * toCoord.y;

          return (
            <g 
              key={`aircraft-${f.flight_id}`} 
              className="cursor-pointer"
              onClick={() => setSelectedFlightId(f.flight_id)}
            >
              <circle
                cx={curX}
                cy={curY}
                r="4.5"
                fill={f.dep_delay_mins > 0 ? '#f59e0b' : '#00e5ff'}
                filter="url(#glow)"
              />
              <text
                x={curX + 6}
                y={curY - 4}
                fill="#ffffff"
                fontSize="9"
                fontFamily="ui-monospace"
                fontWeight="bold"
              >
                {f.flight_id}
              </text>
            </g>
          );
        })}

        {/* Airport Nodes */}
        {Object.values(airportCoords).map(({ x, y, airport }) => {
          const isSelected = selectedAirportId === airport.id;
          const isClosed = disruption?.airportId === airport.id;
          const isHub = airport.tier === 'mega_hub';

          return (
            <g
              key={airport.id}
              className="cursor-pointer group"
              onClick={() => setSelectedAirportId(airport.id)}
              onMouseEnter={() => setHoveredAirport(airport)}
              onMouseLeave={() => setHoveredAirport(null)}
            >
              {/* Pulsing ring for closed airport */}
              {isClosed && (
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  className="animate-radar-pulse"
                />
              )}

              {/* Selection ring */}
              {isSelected && !isClosed && (
                <circle
                  cx={x}
                  cy={y}
                  r="14"
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              )}

              {/* Node core */}
              <circle
                cx={x}
                cy={y}
                r={isHub ? 7 : 5}
                fill={isClosed ? '#f43f5e' : isSelected ? '#00e5ff' : isHub ? '#38bdf8' : '#94a3b8'}
                stroke="#070b14"
                strokeWidth="2"
                filter={isSelected || isClosed ? 'url(#glow)' : undefined}
              />

              {/* Airport Code Label */}
              <text
                x={x}
                y={y + (isHub ? 17 : 14)}
                textAnchor="middle"
                fill={isClosed ? '#f43f5e' : isSelected ? '#00e5ff' : '#cbd5e1'}
                fontSize={isHub ? "11" : "9.5"}
                fontFamily="ui-monospace"
                fontWeight="bold"
                className="group-hover:fill-aviation-cyan transition"
              >
                {airport.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover / Selection Airport Detail Card */}
      {(hoveredAirport || selectedAirportId) && (
        <div className="absolute bottom-4 left-4 z-20 glass-panel p-3.5 rounded-lg border border-aviation-cyan/30 text-xs font-mono max-w-sm pointer-events-none shadow-glow-cyan">
          {(() => {
            const a = hoveredAirport || AIRPORTS_MAP.get(selectedAirportId!)!;
            if (!a) return null;
            const isClosed = disruption?.airportId === a.id;
            const depFlights = currentSim.flightList.filter(f => f.origin === a.id);
            const arrFlights = currentSim.flightList.filter(f => f.destination === a.id);
            const delayedCount = depFlights.filter(f => f.dep_delay_mins > 0).length + arrFlights.filter(f => f.arr_delay_mins > 0).length;

            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-aviation-cyan" />
                    <span className="font-bold text-sm text-white">{a.id} • {a.city}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${isClosed ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {isClosed ? 'CLOSED RUNWAY' : 'OPERATIONAL'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">{a.name}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
                  <div>Tier: <span className="text-aviation-cyan capitalize">{a.tier.replace('_', ' ')}</span></div>
                  <div>Capacity: <span className="text-aviation-cyan">{a.capacity_per_hour} fl/hr</span></div>
                  <div>Departures: <span className="text-white">{depFlights.length}</span></div>
                  <div>Arrivals: <span className="text-white">{arrFlights.length}</span></div>
                </div>
                {delayedCount > 0 && (
                  <div className="pt-1 text-amber-400 text-[11px] flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {delayedCount} affected operations at station
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
