import { 
  FlightSimResult, 
  SimulationResult, 
  RecoveryAction, 
  DisruptionInput 
} from '@/types';
import { 
  SpareAllocationCandidate, 
  SpareAllocationCandidateSchema 
} from '@/types/advancedFeatures';
import { AUTHORITATIVE_DATASET, AIRPORTS_MAP } from '@/data/authoritativeDataset';
import { timeToMins, minsToTime } from '@/lib/timeUtils';
import { runFullSimulation } from './simulationMaster';

// Standard block times for ferry repositioning between bases
const FERRY_MINUTES_MAP: Record<string, Record<string, number>> = {
  'DEL': { 'BOM': 130, 'BLR': 150, 'HYD': 120, 'CCU': 130, 'JAI': 50, 'AMD': 95, 'LKO': 65, 'IXC': 50 },
  'BLR': { 'DEL': 150, 'BOM': 105, 'HYD': 70, 'MAA': 55, 'COK': 60, 'TRV': 75, 'GOI': 70, 'CCU': 150 },
  'BOM': { 'DEL': 130, 'BLR': 105, 'HYD': 85, 'GOI': 65, 'PNQ': 40, 'AMD': 70, 'MAA': 110 },
  'HYD': { 'DEL': 120, 'BLR': 70, 'BOM': 85, 'MAA': 75, 'BBI': 105 },
};

function getFerryFlightMins(from: string, to: string): number {
  if (from === to) return 0;
  if (FERRY_MINUTES_MAP[from]?.[to]) return FERRY_MINUTES_MAP[from][to];
  if (FERRY_MINUTES_MAP[to]?.[from]) return FERRY_MINUTES_MAP[to][from];
  return 110; // default estimated block time across India
}

/**
 * Smart Spare Aircraft Allocation Engine
 * 8-Stage deterministic optimization algorithm
 */
export function generateSmartSpareAllocations(
  baselineResult: SimulationResult
): SpareAllocationCandidate[] {
  const candidates: SpareAllocationCandidate[] = [];
  const baselineMetrics = baselineResult.metrics;
  const disruption = baselineResult.disruption;

  // 1. Find affected flights with departure delays or downstream propagation
  const affectedFlights = baselineResult.flightList.filter(
    f => (f.dep_delay_mins > 0 || f.affected_by_closure) && !f.is_cancelled
  );

  if (affectedFlights.length === 0) {
    return [];
  }

  // 2. Retrieve available spare aircraft from authoritative dataset
  const spareFleet = AUTHORITATIVE_DATASET.spare_aircraft; // VT-DS17 at BLR, VT-DS18 at DEL

  // 3 & 4. Evaluate each candidate pairing
  for (const spare of spareFleet) {
    const spareAvailMins = timeToMins(spare.available_from);

    for (const flight of affectedFlights) {
      const constraintsChecked = [];

      // A. Capacity & Compatibility Check (Uniform 180-seat single-aisle fleet)
      const capacityPassed = spare.seats >= flight.pax;
      constraintsChecked.push({
        rule: 'Aircraft Seating Capacity',
        passed: capacityPassed,
        details: `Spare has ${spare.seats} seats; flight requires ${flight.pax} pax seats.`,
      });

      // B. Positioning Requirement & Ferry Time
      const isColocated = spare.base === flight.origin;
      const ferryDurationMins = isColocated ? 0 : getFerryFlightMins(spare.base, flight.origin);
      const rampPrepMins = isColocated ? 20 : 35; // 20m for cold start on ramp, 35m for ferry reception
      const totalPositioningMins = ferryDurationMins + rampPrepMins;

      // Earliest spare departure time from flight origin
      const spareReadyAtOriginMins = Math.max(spareAvailMins, 300) + totalPositioningMins;

      constraintsChecked.push({
        rule: 'Station Colocation & Positioning Feasibility',
        passed: true,
        details: isColocated 
          ? `Spare ${spare.tail_id} is co-located on the ramp at ${flight.origin} (0m ferry needed).` 
          : `Requires ferry flight from ${spare.base} to ${flight.origin} (${ferryDurationMins}m block + ${rampPrepMins}m ramp prep).`,
      });

      // C. Turnaround & Timing Check
      const targetSchedDepMins = flight.sched_dep_mins;
      const canDepartEarlier = spareReadyAtOriginMins < flight.sim_dep_mins;

      constraintsChecked.push({
        rule: 'Schedule Improvement Check',
        passed: canDepartEarlier,
        details: `Spare ready at ${minsToTime(spareReadyAtOriginMins)} vs delayed flight departing at ${flight.sim_dep} (+${flight.dep_delay_mins}m).`,
      });

      // D. Simulate revision through deterministic simulation engine
      const recoveryAction: RecoveryAction = {
        type: 'SPARE_AIRCRAFT',
        spareTailId: spare.tail_id,
        targetTailId: flight.tail_id,
        spareAvailableAirport: spare.base,
        flightToReplaceId: flight.flight_id,
        notes: `Smart allocation: Deploy ${spare.tail_id} (${spare.base}) to rescue leg ${flight.flight_id} (${flight.origin}→${flight.destination}).`,
      };

      const revisedSim = runFullSimulation(
        disruption, 
        recoveryAction, 
        `smart_spare_eval_${spare.tail_id}_${flight.flight_id}`
      );

      const revisedFlight = revisedSim.flights[flight.flight_id];
      const revisedDelayMins = revisedFlight ? revisedFlight.dep_delay_mins : flight.dep_delay_mins;
      const delaySaved = baselineMetrics.total_dep_delay_mins - revisedSim.metrics.total_dep_delay_mins;
      const paxSaved = baselineMetrics.stranded_passengers - revisedSim.metrics.stranded_passengers;
      const crewViolationsAvoided = baselineMetrics.crew_violations - revisedSim.metrics.crew_violations;

      // Crew Feasibility check
      const crewViolationsRemaining = revisedSim.crewImpacts.some(c => c.crew_id === flight.crew_id && c.violated);
      constraintsChecked.push({
        rule: 'Crew Duty Compliance (600m max)',
        passed: !crewViolationsRemaining,
        details: crewViolationsRemaining 
          ? `Crew ${flight.crew_id} duty limit still exceeded downstream.` 
          : `Crew ${flight.crew_id} duty envelope fully safeguarded within legal 600m.`,
      });

      // 6. Ranking objective function:
      // Score = (delaySaved * 2.5) + (paxSaved * 12.0) + (crewViolationsAvoided * 80.0) - (ferryDurationMins * 1.2)
      const allocationScore = Math.round(
        (delaySaved * 2.5) + 
        (paxSaved * 12.0) + 
        (crewViolationsAvoided * 80.0) - 
        (ferryDurationMins * 1.2)
      );

      let status: 'OPTIMAL' | 'FEASIBLE' | 'SUBOPTIMAL' | 'INFEASIBLE' = 'FEASIBLE';
      if (delaySaved <= 0 && paxSaved <= 0) {
        status = 'INFEASIBLE';
      } else if (isColocated && delaySaved > 60) {
        status = 'OPTIMAL';
      } else if (delaySaved > 30) {
        status = 'FEASIBLE';
      } else {
        status = 'SUBOPTIMAL';
      }

      const candidateObj = {
        id: `ALLOC_${spare.tail_id}_${flight.flight_id}`,
        spareTailId: spare.tail_id,
        targetFlightId: flight.flight_id,
        originalTailId: flight.tail_id,
        currentAirport: spare.base,
        targetAirport: flight.origin,
        positioningRequired: !isColocated,
        positioningTimeMins: totalPositioningMins,
        spareReadinessTime: minsToTime(spareReadyAtOriginMins),
        originalFlightDelayMins: flight.dep_delay_mins,
        revisedFlightDelayMins: revisedDelayMins,
        delayReductionMins: Math.max(0, delaySaved),
        passengersProtected: Math.max(0, paxSaved),
        crewFeasible: !crewViolationsRemaining,
        crewViolationAvoided: crewViolationsAvoided > 0,
        allocationScore,
        status,
        operationalRationale: isColocated
          ? `Ramp Spare ${spare.tail_id} is co-located at hub ${spare.base}. Ingesting it into rotation ${flight.tail_id} eliminates +${flight.dep_delay_mins}m on ${flight.flight_id} and resets downstream legs.`
          : `Ferrying ${spare.tail_id} from ${spare.base} to ${flight.origin} takes ${ferryDurationMins}m, successfully absorbing delay and protecting ${paxSaved} connecting passengers.`,
        constraintsChecked,
      };

      // Zod validation check
      const validated = SpareAllocationCandidateSchema.parse(candidateObj);
      if (validated.status !== 'INFEASIBLE') {
        candidates.push(validated);
      }
    }
  }

  // Sort candidates by allocationScore descending
  candidates.sort((a, b) => b.allocationScore - a.allocationScore);

  return candidates;
}
