import { 
  DisruptionInput, 
  RecoveryAction, 
  SimulationResult 
} from '@/types';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';
import { runDeterministicDelayEngine } from './delayEngine';
import { runDeterministicPassengerEngine } from './passengerEngine';
import { runDeterministicCrewEngine } from './crewEngine';
import { calculateSimulationMetrics } from './metricsEngine';
import { generateEventTimeline } from './eventTimelineEngine';

export function runFullSimulation(
  disruption: DisruptionInput | null,
  recoveryAction: RecoveryAction | null = null,
  scenarioId = 'sim_run'
): SimulationResult {
  const flightResults = runDeterministicDelayEngine(
    AUTHORITATIVE_DATASET.flights,
    disruption,
    recoveryAction
  );

  const passengerImpacts = runDeterministicPassengerEngine(flightResults);
  const crewImpacts = runDeterministicCrewEngine(flightResults);
  const metrics = calculateSimulationMetrics(flightResults, passengerImpacts, crewImpacts);
  const events = generateEventTimeline(disruption, flightResults, passengerImpacts, crewImpacts);

  // Sorted flight list
  const flightList = Object.values(flightResults).sort((a, b) => a.sched_dep_mins - b.sched_dep_mins);

  return {
    id: scenarioId,
    disruption: disruption || { airportId: '', startTime: '00:00', durationMins: 0 },
    recoveryAction: recoveryAction || undefined,
    flights: flightResults,
    flightList,
    passengerImpacts,
    crewImpacts,
    metrics,
    eventsChronological: events
  };
}
