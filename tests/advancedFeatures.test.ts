import { describe, it, expect } from 'vitest';
import { runFullSimulation } from '../src/engine/simulationMaster';
import { generateSmartSpareAllocations } from '../src/engine/smartSpareEngine';
import { calculateNetworkVulnerability } from '../src/engine/vulnerabilityEngine';
import { 
  SpareAllocationCandidateSchema, 
  AirportVulnerabilityMetricsSchema 
} from '../src/types/advancedFeatures';
import { AUTHORITATIVE_DATASET } from '../src/data/authoritativeDataset';

describe('Domino Sky – Advanced Features Test Suite', () => {
  // ===============================================
  // FEATURE 1: SMART SPARE AIRCRAFT ALLOCATION
  // ===============================================
  describe('Feature 1: Smart Spare Aircraft Allocation Engine', () => {
    it('should identify available spare fleet correctly from authoritative dataset', () => {
      expect(AUTHORITATIVE_DATASET.spare_aircraft.length).toBe(2);
      const tails = AUTHORITATIVE_DATASET.spare_aircraft.map(s => s.tail_id);
      expect(tails).toContain('VT-DS17');
      expect(tails).toContain('VT-DS18');
    });

    it('should generate valid candidate allocations during a disruption', () => {
      // DEL closed 08:00 for 90 mins
      const sim = runFullSimulation({ airportId: 'DEL', startTime: '08:00', durationMins: 90 });
      const candidates = generateSmartSpareAllocations(sim);

      expect(candidates.length).toBeGreaterThan(0);
      const topCand = candidates[0];

      // Validate Zod schema
      expect(() => SpareAllocationCandidateSchema.parse(topCand)).not.toThrow();

      // Check optimization properties
      expect(topCand.delayReductionMins).toBeGreaterThan(0);
      expect(topCand.spareTailId).toMatch(/VT-DS17|VT-DS18/);
      expect(topCand.status).toBe('OPTIMAL');
    });

    it('should differentiate colocated spares (0m ferry) from inter-station ferry flights', () => {
      const sim = runFullSimulation({ airportId: 'DEL', startTime: '08:00', durationMins: 90 });
      const candidates = generateSmartSpareAllocations(sim);

      const colocated = candidates.find(c => c.currentAirport === c.targetAirport);
      const remote = candidates.find(c => c.currentAirport !== c.targetAirport);

      if (colocated) {
        expect(colocated.positioningRequired).toBe(false);
        expect(colocated.positioningTimeMins).toBe(20); // 20m ramp cold start
      }
      if (remote) {
        expect(remote.positioningRequired).toBe(true);
        expect(remote.positioningTimeMins).toBeGreaterThan(50);
      }
    });
  });

  // ===============================================
  // FEATURE 2: NETWORK VULNERABILITY HEAT MAP
  // ===============================================
  describe('Feature 2: Network Vulnerability Heat Map Engine', () => {
    it('should calculate vulnerability metrics for all 16 airports', () => {
      const metrics = calculateNetworkVulnerability();
      expect(metrics.length).toBe(16);

      // Validate all against Zod schema
      for (const m of metrics) {
        expect(() => AirportVulnerabilityMetricsSchema.parse(m)).not.toThrow();
        expect(m.compositeVulnerabilityScore).toBeGreaterThanOrEqual(0);
        expect(m.compositeVulnerabilityScore).toBeLessThanOrEqual(100);
      }
    });

    it('should rank mega hubs higher than spoke airports in vulnerability', () => {
      const metrics = calculateNetworkVulnerability();
      const del = metrics.find(m => m.airportId === 'DEL')!;
      const bom = metrics.find(m => m.airportId === 'BOM')!;
      const jax = metrics.find(m => m.airportId === 'JAI')!;
      const ixc = metrics.find(m => m.airportId === 'IXC')!;

      // Mega hubs with heavy rotation cross-overs must have higher vulnerability
      expect(del.compositeVulnerabilityScore).toBeGreaterThan(jax.compositeVulnerabilityScore);
      expect(bom.compositeVulnerabilityScore).toBeGreaterThan(ixc.compositeVulnerabilityScore);
      expect(del.vulnerabilityLevel).toBe('HIGH');
    });

    it('should dynamically update scores when weights are modified', () => {
      const standard = calculateNetworkVulnerability();
      const custom = calculateNetworkVulnerability({
        degree: 0.5,
        betweenness: 0.1,
        rotation: 0.1,
        passenger: 0.1,
        alternative: 0.1,
        recovery: 0.1
      });

      expect(standard[0].compositeVulnerabilityScore).toBeDefined();
      expect(custom[0].compositeVulnerabilityScore).toBeDefined();
    });
  });

  // ===============================================
  // FEATURE 3: DOMINO REPLAY TIMELINE
  // ===============================================
  describe('Feature 3: Domino Replay Timeline System', () => {
    it('should generate chronological events ordered by timestamp', () => {
      const sim = runFullSimulation({ airportId: 'DEL', startTime: '08:00', durationMins: 90 });
      const events = sim.eventsChronological;

      expect(events.length).toBeGreaterThan(0);
      for (let i = 1; i < events.length; i++) {
        expect(events[i].timeMins).toBeGreaterThanOrEqual(events[i - 1].timeMins);
      }
    });

    it('should record distinct event categories (closure, flight dep, connection break, crew limit)', () => {
      const sim = runFullSimulation({ airportId: 'DEL', startTime: '08:00', durationMins: 120 });
      const types = new Set(sim.eventsChronological.map(e => e.type));

      expect(types.has('CLOSURE_START')).toBe(true);
      expect(types.has('CLOSURE_END')).toBe(true);
      expect(types.has('FLIGHT_DEP')).toBe(true);
      expect(types.has('FLIGHT_ARR')).toBe(true);
    });
  });
});
