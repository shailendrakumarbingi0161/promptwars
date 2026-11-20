import { 
  FlightSimResult, 
  PassengerImpactResult, 
  CrewImpactResult, 
  SimulationEvent, 
  DisruptionInput 
} from '@/types';
import { timeToMins, minsToTime } from '@/lib/timeUtils';

export function generateEventTimeline(
  disruption: DisruptionInput | null,
  flightResults: Record<string, FlightSimResult>,
  passengerImpacts: PassengerImpactResult[],
  crewImpacts: CrewImpactResult[]
): SimulationEvent[] {
  const events: SimulationEvent[] = [];

  // 1. Disruption start & end
  if (disruption) {
    const startM = timeToMins(disruption.startTime);
    const endM = startM + disruption.durationMins;

    events.push({
      id: 'EV_CLOSURE_START',
      timeMins: startM,
      timeStr: disruption.startTime,
      type: 'CLOSURE_START',
      title: `Airport Closed: ${disruption.airportId}`,
      description: `Runway closure initiated at ${disruption.airportId} for ${disruption.durationMins} minutes.`,
      severity: 'critical',
      airport: disruption.airportId
    });

    events.push({
      id: 'EV_CLOSURE_END',
      timeMins: endM,
      timeStr: minsToTime(endM),
      type: 'CLOSURE_END',
      title: `Airport Reopened: ${disruption.airportId}`,
      description: `Normal operations resume at ${disruption.airportId}. Downstream departures and arrivals cleared to operate.`,
      severity: 'info',
      airport: disruption.airportId
    });
  }

  // 2. Flight Departures & Arrivals
  for (const f of Object.values(flightResults)) {
    if (f.is_cancelled) {
      events.push({
        id: `EV_CANCEL_${f.flight_id}`,
        timeMins: f.sched_dep_mins,
        timeStr: f.sched_dep,
        type: 'DELAY_TRIGGER',
        title: `Flight Cancelled: ${f.flight_id}`,
        description: `${f.flight_id} (${f.origin} -> ${f.destination}) cancelled. ${f.cancellation_reason || ''}`,
        severity: 'critical',
        flight_id: f.flight_id,
        airport: f.origin
      });
      continue;
    }

    // Departure event
    events.push({
      id: `EV_DEP_${f.flight_id}`,
      timeMins: f.sim_dep_mins,
      timeStr: f.sim_dep,
      type: 'FLIGHT_DEP',
      title: `Departure: ${f.flight_id} (${f.origin} -> ${f.destination})`,
      description: f.dep_delay_mins > 0 
        ? `Departed ${f.dep_delay_mins}m delayed due to ${f.primary_cause}.`
        : `Departed strictly on time at ${f.sim_dep}.`,
      severity: f.dep_delay_mins >= 60 ? 'critical' : f.dep_delay_mins > 0 ? 'warning' : 'info',
      flight_id: f.flight_id,
      airport: f.origin
    });

    // Arrival event
    events.push({
      id: `EV_ARR_${f.flight_id}`,
      timeMins: f.sim_arr_mins,
      timeStr: f.sim_arr,
      type: 'FLIGHT_ARR',
      title: `Arrival: ${f.flight_id} at ${f.destination}`,
      description: f.arr_delay_mins > 0
        ? `Landed with ${f.arr_delay_mins}m arrival delay. Aircraft ${f.tail_id} turnaround starts.`
        : `Landed on time at ${f.destination}.`,
      severity: f.arr_delay_mins >= 60 ? 'critical' : f.arr_delay_mins > 0 ? 'warning' : 'info',
      flight_id: f.flight_id,
      airport: f.destination
    });
  }

  // 3. Broken passenger connections
  for (const p of passengerImpacts) {
    if (p.status === 'MISSED_STRANDED' || p.status === 'CANCELLED_STRANDED') {
      const fromF = flightResults[p.from_flight];
      events.push({
        id: `EV_MISCONNECT_${p.connection_id}`,
        timeMins: fromF ? fromF.sim_arr_mins : 0,
        timeStr: fromF ? fromF.sim_arr : '00:00',
        type: 'CONNECTION_BREAK',
        title: `Connection Broken: ${p.passengers} Pax Stranded at ${p.airport}`,
        description: `Transfer ${p.from_flight} -> ${p.to_flight} broken. Window: ${p.sim_window_mins}m vs ${p.min_connect_minutes}m min required.`,
        severity: 'critical',
        airport: p.airport,
        flight_id: p.from_flight
      });
    }
  }

  // 4. Crew violations
  for (const c of crewImpacts) {
    if (c.violated) {
      events.push({
        id: `EV_CREW_${c.crew_id}`,
        timeMins: c.duty_start_mins + c.max_duty_mins,
        timeStr: minsToTime(c.duty_start_mins + c.max_duty_mins),
        type: 'CREW_LIMIT',
        title: `Crew Legal Timeout: Crew ${c.crew_id}`,
        description: `Crew reached 600m duty threshold. Operating base: ${c.base}. Flights prohibited from departing without substitution.`,
        severity: 'critical',
        airport: c.base
      });
    }
  }

  // Sort strictly chronological
  events.sort((a, b) => {
    if (a.timeMins !== b.timeMins) return a.timeMins - b.timeMins;
    return a.id.localeCompare(b.id);
  });

  return events;
}
