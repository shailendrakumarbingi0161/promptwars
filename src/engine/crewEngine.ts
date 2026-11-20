import { FlightSimResult, CrewImpactResult } from '@/types';
import { timeToMins, minsToTime } from '@/lib/timeUtils';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';

export function runDeterministicCrewEngine(
  flightResults: Record<string, FlightSimResult>
): CrewImpactResult[] {
  const crewImpacts: CrewImpactResult[] = [];

  for (const crew of AUTHORITATIVE_DATASET.crews) {
    const dutyStartMins = timeToMins(crew.duty_start);
    const flightIds = crew.flight_ids;
    
    // Find scheduled last flight and simulated last flight
    const lastFlightId = flightIds[flightIds.length - 1];
    const lastFlightRes = flightResults[lastFlightId];

    if (!lastFlightRes) {
      continue;
    }

    const schedEndMins = lastFlightRes.sched_arr_mins;
    const simEndMins = lastFlightRes.sim_arr_mins;

    const schedDutyMins = schedEndMins - dutyStartMins;
    const simDutyMins = simEndMins - dutyStartMins;
    const marginMins = crew.max_duty_mins - simDutyMins;
    const isViolated = simDutyMins > crew.max_duty_mins;

    if (isViolated) {
      // Flag all flights on this roster
      for (const fid of flightIds) {
        if (flightResults[fid]) {
          flightResults[fid].crew_duty_exceeded = true;
        }
      }

      // Add to last flight's Delay DNA
      const excessMins = simDutyMins - crew.max_duty_mins;
      lastFlightRes.delay_dna.push({
        stage: lastFlightRes.delay_dna.length + 1,
        type: 'CREW_TIMEOUT',
        title: `Crew Legal Timeout Violation (+${excessMins}m excess)`,
        description: `Crew ${crew.crew_id} reached ${simDutyMins}m of continuous duty (legal limit: ${crew.max_duty_mins}m / 10h). Flight ${lastFlightId} cannot depart without relief crew.`,
        delay_added_mins: 0,
        cumulative_delay_mins: lastFlightRes.dep_delay_mins,
        flight_id: lastFlightId,
        tail_id: lastFlightRes.tail_id
      });
    }

    crewImpacts.push({
      crew_id: crew.crew_id,
      tail_id: crew.tail_id,
      base: crew.base,
      duty_start: crew.duty_start,
      duty_start_mins: dutyStartMins,
      sched_end: minsToTime(schedEndMins),
      sim_end: minsToTime(simEndMins),
      sched_duty_mins: schedDutyMins,
      sim_duty_mins: simDutyMins,
      max_duty_mins: crew.max_duty_mins,
      margin_mins: marginMins,
      violated: isViolated,
      flights_operated: flightIds
    });
  }

  return crewImpacts;
}
