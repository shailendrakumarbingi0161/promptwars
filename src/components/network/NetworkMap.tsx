'use client';

import React, { useState, useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { AUTHORITATIVE_DATASET, AIRPORTS_MAP } from '@/data/authoritativeDataset';
import { INDIA_BORDER_COORDS, SRI_LANKA_COORDS, FIR_REGIONS } from '@/data/indiaGeoData';
import { Airport, FlightSimResult } from '@/types';
import { playRadarBlip } from '@/lib/soundEffects';
import { 
  Plane, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  Radio, 
  Compass, 
  Eye, 
  Layers,
  Crosshair
} from 'lucide-react';

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
  const [showFirSectors, setShowFirSectors] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);

  // Geographic projection bounds for India
  const width = 850;
  const height = 780;
  const paddingX = 65;
  const paddingY = 55;
  
  // Projection bounding box encompassing full India + Island territories
  const minLng = 68.0;
  const maxLng = 97.0;
  const minLat = 6.8;
  const maxLat = 36.5;

  const project = (lat: number, lng: number) => {
    const x = paddingX + ((lng - minLng) / (maxLng - minLng)) * (width - 2 * paddingX);
    const y = height - paddingY - ((lat - minLat) / (maxLat - minLat)) * (height - 2 * paddingY);
    return { x, y };
  };

  // Projected India Landmass SVG Path
  const indiaSvgPath = useMemo(() => {
    return INDIA_BORDER_COORDS.map((coord, idx) => {
      const pt = project(coord[0], coord[1]);
      return `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }).join(' ') + ' Z';
  }, []);

  // Projected Sri Lanka SVG Path
  const sriLankaSvgPath = useMemo(() => {
    return SRI_LANKA_COORDS.map((coord, idx) => {
      const pt = project(coord[0], coord[1]);
      return `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }).join(' ') + ' Z';
  }, []);

  // Pre-calculate airport positions
  const airportCoords = useMemo(() => {
    const coords: Record<string, { x: number; y: number; airport: Airport }> = {};
    for (const a of AUTHORITATIVE_DATASET.airports) {
      coords[a.id] = { ...project(a.lat, a.lng), airport: a };
    }
    return coords;
  }, []);

  // Projected FIR dividing crosshairs (Nagpur Center is the geographic crossroads of Indian FIRs)
  const firCrossroads = useMemo(() => {
    return project(21.1458, 79.0882); // Nagpur FIR Center
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
    <div className="relative w-full h-full min-h-[620px] flex flex-col items-center justify-center bg-[#050912] rounded-xl border border-aviation-cardBorder overflow-hidden select-none">
      {/* HUD Radar Overlay Header */}
      <div className="absolute top-3 left-4 z-10 flex items-center space-x-2 text-xs font-mono text-aviation-cyan">
        <Compass className="w-4 h-4 animate-spin text-aviation-cyan/70" style={{ animationDuration: '24s' }} />
        <span className="font-bold tracking-wider">AIRSPACE RADAR TRACKER // INDIA FLIGHT INFORMATION REGION (FIR)</span>
      </div>

      {/* Map Layer Controls */}
      <div className="absolute top-3 right-4 z-10 flex items-center space-x-2 text-[11px] font-mono">
        <button
          onClick={() => setShowFirSectors(!showFirSectors)}
          className={`px-2 py-1 rounded border transition flex items-center gap-1 ${
            showFirSectors 
              ? 'bg-aviation-cyan/15 text-aviation-cyan border-aviation-cyan/30' 
              : 'bg-slate-900/80 text-slate-500 border-slate-800'
          }`}
          title="Toggle FIR Airspace Sectors"
        >
          <Layers className="w-3 h-3" />
          <span>FIR Sectors</span>
        </button>

        <button
          onClick={() => setShowRadarSweep(!showRadarSweep)}
          className={`px-2 py-1 rounded border transition flex items-center gap-1 ${
            showRadarSweep 
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
              : 'bg-slate-900/80 text-slate-500 border-slate-800'
          }`}
          title="Toggle Radar Sweep Beam"
        >
          <Radio className="w-3 h-3" />
          <span>Radar Sweep</span>
        </button>
      </div>

      {/* Main SVG Radar Map with India Subcontinent */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[880px] h-auto drop-shadow-2xl"
      >
        <defs>
          {/* Radial grid gradient */}
          <radialGradient id="radarGridGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.03" />
            <stop offset="60%" stopColor="#00e5ff" stopOpacity="0.01" />
            <stop offset="100%" stopColor="#070b14" stopOpacity="0" />
          </radialGradient>

          {/* India landmass gradient */}
          <linearGradient id="indiaLandmass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0c1829" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#0a1422" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#070f1c" stopOpacity="0.95" />
          </linearGradient>

          {/* Ocean Water Pattern */}
          <pattern id="oceanGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="40" y2="0" stroke="#0e1d33" strokeWidth="0.5" strokeOpacity="0.3" />
            <line x1="0" y1="0" x2="0" y2="40" stroke="#0e1d33" strokeWidth="0.5" strokeOpacity="0.3" />
          </pattern>

          {/* Radar Sweep Rotating Beam Gradient */}
          <linearGradient id="sweepBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </linearGradient>

          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ocean Background Grid */}
        <rect width={width} height={height} fill="url(#oceanGrid)" />
        <rect width={width} height={height} fill="url(#radarGridGlow)" />

        {/* Primary Radar Concentric Rings */}
        <circle cx={width / 2} cy={height / 2} r={340} fill="none" stroke="#162744" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />
        <circle cx={width / 2} cy={height / 2} r={240} fill="none" stroke="#162744" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />
        <circle cx={width / 2} cy={height / 2} r={140} fill="none" stroke="#162744" strokeWidth="1" strokeDasharray="3 6" opacity="0.5" />

        {/* Range Rings Distance Annotations */}
        <text x={width / 2 + 145} y={height / 2 - 5} fill="#334155" fontSize="8" fontFamily="ui-monospace">400 NM</text>
        <text x={width / 2 + 245} y={height / 2 - 5} fill="#334155" fontSize="8" fontFamily="ui-monospace">800 NM</text>
        <text x={width / 2 + 345} y={height / 2 - 5} fill="#334155" fontSize="8" fontFamily="ui-monospace">1200 NM</text>

        {/* Oceanic Labels */}
        <g opacity="0.28" fill="#475569" fontFamily="ui-monospace" fontSize="11" letterSpacing="4">
          <text x={110} y={530} transform="rotate(-15 110 530)">ARABIAN SEA</text>
          <text x={610} y={530} transform="rotate(15 610 530)">BAY OF BENGAL</text>
          <text x={340} y={740}>INDIAN OCEAN</text>
          <text x={440} y={130} transform="rotate(-8 440 130)">HIMALAYAN CORRIDOR</text>
        </g>

        {/* --- INDIA GEOGRAPHIC MAP LAYER --- */}
        {/* Landmass Shadow for 3D depth */}
        <path
          d={indiaSvgPath}
          fill="none"
          stroke="#00e5ff"
          strokeWidth="3.5"
          strokeOpacity="0.15"
          filter="url(#cyanGlow)"
        />

        {/* India Continent Fill & Outer Border */}
        <path
          d={indiaSvgPath}
          fill="url(#indiaLandmass)"
          stroke="#00e5ff"
          strokeWidth="1.8"
          strokeOpacity="0.55"
        />

        {/* Sri Lanka Outline */}
        <path
          d={sriLankaSvgPath}
          fill="#0c1829"
          stroke="#00e5ff"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />

        {/* FIR Airspace Boundary Dividing Lines (Delhi, Mumbai, Kolkata, Chennai) */}
        {showFirSectors && (
          <g stroke="#00e5ff" strokeWidth="0.8" strokeDasharray="4 6" strokeOpacity="0.22">
            {/* North-South dividing line through Nagpur */}
            <line x1={firCrossroads.x} y1={paddingY} x2={firCrossroads.x} y2={height - paddingY} />
            {/* East-West dividing line through Nagpur */}
            <line x1={paddingX} y1={firCrossroads.y} x2={width - paddingX} y2={firCrossroads.y} />
            
            {/* Sector Labels */}
            <text x={firCrossroads.x - 140} y={firCrossroads.y - 120} fill="#00e5ff" fontSize="9" fontFamily="ui-monospace" opacity="0.4">
              VIDF • DELHI FIR
            </text>
            <text x={firCrossroads.x - 150} y={firCrossroads.y + 110} fill="#00e5ff" fontSize="9" fontFamily="ui-monospace" opacity="0.4">
              VABF • MUMBAI FIR
            </text>
            <text x={firCrossroads.x + 80} y={firCrossroads.y - 110} fill="#00e5ff" fontSize="9" fontFamily="ui-monospace" opacity="0.4">
              VECF • KOLKATA FIR
            </text>
            <text x={firCrossroads.x + 60} y={firCrossroads.y + 110} fill="#00e5ff" fontSize="9" fontFamily="ui-monospace" opacity="0.4">
              VOMF • CHENNAI FIR
            </text>
          </g>
        )}

        {/* Live Sweeping Primary Radar Line */}
        {showRadarSweep && (
          <g>
            <line
              x1={width / 2}
              y1={height / 2}
              x2={width / 2 + 350}
              y2={height / 2}
              stroke="#00e5ff"
              strokeWidth="1.5"
              strokeOpacity="0.6"
              filter="url(#cyanGlow)"
              style={{
                transformOrigin: `${width / 2}px ${height / 2}px`,
                animation: 'radarSweepSpin 8s linear infinite'
              }}
            />
          </g>
        )}

        {/* Flight Routes (Curved Arcs Between Indian Airports) */}
        {routes.map((route, idx) => {
          const fromCoord = airportCoords[route.from.id];
          const toCoord = airportCoords[route.to.id];
          if (!fromCoord || !toCoord) return null;

          const midX = (fromCoord.x + toCoord.x) / 2;
          const midY = (fromCoord.y + toCoord.y) / 2;
          const dx = toCoord.x - fromCoord.x;
          const dy = toCoord.y - fromCoord.y;
          const curvature = 0.12;
          const ctrlX = midX - dy * curvature;
          const ctrlY = midY + dx * curvature;

          const isClosedOrigin = disruption?.airportId === route.from.id;
          const isClosedDest = disruption?.airportId === route.to.id;

          let strokeColor = '#10b981'; // Green
          let strokeOpacity = 0.35;
          let strokeWidth = 1.4;

          if (isClosedOrigin || isClosedDest || route.maxDelay >= 60) {
            strokeColor = '#f43f5e'; // Red
            strokeOpacity = 0.8;
            strokeWidth = 2.2;
          } else if (route.maxDelay > 0) {
            strokeColor = '#f59e0b'; // Amber
            strokeOpacity = 0.6;
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

        {/* Active Airborne Aircraft Moving on Corridors */}
        {activeAirborneFlights.map(f => {
          const fromCoord = airportCoords[f.origin];
          const toCoord = airportCoords[f.destination];
          if (!fromCoord || !toCoord) return null;

          const duration = f.sim_arr_mins - f.sim_dep_mins;
          const progress = duration > 0 ? (replayTimeMins - f.sim_dep_mins) / duration : 0;
          const clampedProgress = Math.max(0, Math.min(1, progress));

          const midX = (fromCoord.x + toCoord.x) / 2;
          const midY = (fromCoord.y + toCoord.y) / 2;
          const dx = toCoord.x - fromCoord.x;
          const dy = toCoord.y - fromCoord.y;
          const curvature = 0.12;
          const ctrlX = midX - dy * curvature;
          const ctrlY = midY + dx * curvature;

          const t = clampedProgress;
          const curX = (1 - t) * (1 - t) * fromCoord.x + 2 * (1 - t) * t * ctrlX + t * t * toCoord.x;
          const curY = (1 - t) * (1 - t) * fromCoord.y + 2 * (1 - t) * t * ctrlY + t * t * toCoord.y;

          // Tangent heading angle calculation for aircraft orientation
          const tangentX = 2 * (1 - t) * (ctrlX - fromCoord.x) + 2 * t * (toCoord.x - ctrlX);
          const tangentY = 2 * (1 - t) * (ctrlY - fromCoord.y) + 2 * t * (toCoord.y - ctrlY);
          const headingDeg = (Math.atan2(tangentY, tangentX) * 180) / Math.PI;

          const isDelayed = f.dep_delay_mins > 0;
          const planeColor = isDelayed ? '#f59e0b' : '#00e5ff';

          return (
            <g 
              key={`aircraft-${f.flight_id}`} 
              className="cursor-pointer group"
              transform={`translate(${curX}, ${curY})`}
              onClick={() => {
                playRadarBlip();
                setSelectedFlightId(f.flight_id);
              }}
            >
              {/* Rotating Jet Aircraft Silhouette */}
              <g transform={`rotate(${headingDeg})`}>
                {/* Aircraft Jet Engine Exhaust Trail */}
                <line
                  x1="-10"
                  y1="0"
                  x2="-22"
                  y2="0"
                  stroke={planeColor}
                  strokeWidth="1.5"
                  strokeOpacity="0.45"
                  strokeDasharray="3 3"
                />

                {/* Symmetrical Commercial Jet Airliner Silhouette (Pointing +X) */}
                <path
                  d="M 13 0 L 8 -2.4 L 2 -11 L -0.5 -11 L 1.8 -2.4 L -5 -2.4 L -8 -7 L -10.5 -7 L -8.5 0 L -10.5 7 L -8 7 L -5 2.4 L 1.8 2.4 L -0.5 11 L 2 11 L 8 2.4 Z"
                  fill={planeColor}
                  stroke="#050912"
                  strokeWidth="0.9"
                  filter="url(#cyanGlow)"
                  className="transition-transform group-hover:scale-125"
                />
              </g>

              {/* Callout Flight Badge with Call Sign & Delay */}
              <g transform="translate(12, -12)">
                <rect
                  x="-3"
                  y="-11"
                  width={isDelayed ? "68" : "48"}
                  height="15"
                  rx="3.5"
                  fill="#070b14"
                  fillOpacity="0.9"
                  stroke={planeColor}
                  strokeWidth="0.8"
                  strokeOpacity="0.7"
                />
                <text
                  x="2"
                  y="0"
                  fill="#ffffff"
                  fontSize="8.5"
                  fontFamily="ui-monospace"
                  fontWeight="bold"
                >
                  {f.flight_id}
                  {isDelayed ? ` +${f.dep_delay_mins}m` : ''}
                </text>
              </g>
            </g>
          );
        })}

        {/* Airport Stations (16 Indian Cities) */}
        {Object.values(airportCoords).map(({ x, y, airport }) => {
          const isSelected = selectedAirportId === airport.id;
          const isClosed = disruption?.airportId === airport.id;
          const isHub = airport.tier === 'mega_hub';

          return (
            <g
              key={airport.id}
              className="cursor-pointer group"
              onClick={() => {
                playRadarBlip();
                setSelectedAirportId(airport.id);
              }}
              onMouseEnter={() => setHoveredAirport(airport)}
              onMouseLeave={() => setHoveredAirport(null)}
            >
              {/* Pulsing ring for closed airport */}
              {isClosed && (
                <circle
                  cx={x}
                  cy={y}
                  r="19"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.2"
                  className="animate-radar-pulse"
                />
              )}

              {/* Selection ring */}
              {isSelected && !isClosed && (
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="1.6"
                  strokeDasharray="3 3"
                />
              )}

              {/* Node core */}
              <circle
                cx={x}
                cy={y}
                r={isHub ? 7.5 : 5.5}
                fill={isClosed ? '#f43f5e' : isSelected ? '#00e5ff' : isHub ? '#38bdf8' : '#94a3b8'}
                stroke="#050912"
                strokeWidth="2.2"
                filter={isSelected || isClosed ? 'url(#cyanGlow)' : undefined}
              />

              {/* Airport Code Callout Label */}
              <text
                x={x}
                y={y + (isHub ? 18 : 15)}
                textAnchor="middle"
                fill={isClosed ? '#f43f5e' : isSelected ? '#00e5ff' : '#e2e8f0'}
                fontSize={isHub ? "11.5" : "10"}
                fontFamily="ui-monospace"
                fontWeight="bold"
                className="group-hover:fill-aviation-cyan transition drop-shadow-md"
              >
                {airport.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend Bar at Bottom */}
      <div className="absolute bottom-3 right-4 z-10 flex items-center space-x-3 text-[10px] font-mono bg-aviation-darkest/90 px-3 py-1.5 rounded-lg border border-aviation-cardBorder text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Nominal</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Delayed (&lt;60m)</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Severe / Ground Stop</span>
        </div>
      </div>

      {/* Hover / Selected Airport Telemetry Card */}
      {(hoveredAirport || selectedAirportId) && (
        <div className="absolute bottom-3 left-4 z-20 glass-panel p-3.5 rounded-xl border border-aviation-cyan/40 text-xs font-mono max-w-sm pointer-events-none shadow-glow-cyan">
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
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isClosed ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isClosed ? 'CLOSED RUNWAY' : 'OPERATIONAL'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">{a.name}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
                  <div>Tier: <span className="text-aviation-cyan capitalize">{a.tier.replace('_', ' ')}</span></div>
                  <div>Capacity: <span className="text-aviation-cyan">{a.capacity_per_hour} fl/hr</span></div>
                  <div>Departures: <span className="text-white font-semibold">{depFlights.length}</span></div>
                  <div>Arrivals: <span className="text-white font-semibold">{arrFlights.length}</span></div>
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

      {/* Global CSS for Radar Sweep Spin Animation */}
      <style jsx global>{`
        @keyframes radarSweepSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
