import { FlightSimResult, PassengerImpactResult } from '@/types';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';

export function runDeterministicPassengerEngine(
  flightResults: Record<string, FlightSimResult>
): PassengerImpactResult[] {
  const impacts: PassengerImpactResult[] = [];

  for (const cx of AUTHORITATIVE_DATASET.connections) {
    const fromRes = flightResults[cx.from_flight];
    const toRes = flightResults[cx.to_flight];

    if (!fromRes || !toRes) {
      continue;
    }

    const schedWindow = toRes.sched_dep_mins - fromRes.sched_arr_mins;
    const simWindow = toRes.sim_dep_mins - fromRes.sim_arr_mins;

    if (fromRes.is_cancelled || toRes.is_cancelled) {
      impacts.push({
        connection_id: cx.connection_id,
        airport: cx.airport,
        from_flight: cx.from_flight,
        to_flight: cx.to_flight,
        passengers: cx.passengers,
        min_connect_minutes: cx.min_connect_minutes,
        sched_window_mins: schedWindow,
        sim_window_mins: simWindow,
        status: 'CANCELLED_STRANDED',
        reason: fromRes.is_cancelled 
          ? `Inbound flight ${cx.from_flight} was cancelled`
          : `Connecting outbound flight ${cx.to_flight} was cancelled`
      });

      toRes.delay_dna.push({
        stage: toRes.delay_dna.length + 1,
        type: 'PASSENGER_MISCONNECT',
        title: `Passenger Stranding (${cx.passengers} pax)`,
        description: `${cx.passengers} connecting passengers stranded at ${cx.airport} due to flight cancellation (${cx.from_flight} -> ${cx.to_flight}).`,
        delay_added_mins: 0,
        cumulative_delay_mins: toRes.dep_delay_mins,
        airport: cx.airport,
        flight_id: toRes.flight_id
      });
      continue;
    }

    if (simWindow < cx.min_connect_minutes) {
      const deficit = cx.min_connect_minutes - simWindow;
      impacts.push({
        connection_id: cx.connection_id,
        airport: cx.airport,
        from_flight: cx.from_flight,
        to_flight: cx.to_flight,
        passengers: cx.passengers,
        min_connect_minutes: cx.min_connect_minutes,
        sched_window_mins: schedWindow,
        sim_window_mins: simWindow,
        status: 'MISSED_STRANDED',
        reason: `Transfer window shrunk to ${simWindow}m (required: ${cx.min_connect_minutes}m, deficit: ${deficit}m). Inbound arrived ${fromRes.arr_delay_mins}m late.`
      });

      toRes.delay_dna.push({
        stage: toRes.delay_dna.length + 1,
        type: 'PASSENGER_MISCONNECT',
        title: `Missed Connection: ${cx.passengers} Stranded Pax`,
        description: `Connection ${cx.connection_id} missed at ${cx.airport}: Inbound ${cx.from_flight} arrived late, leaving only ${simWindow}m vs ${cx.min_connect_minutes}m minimum connection time.`,
        delay_added_mins: 0,
        cumulative_delay_mins: toRes.dep_delay_mins,
        airport: cx.airport,
        flight_id: toRes.flight_id
      });
    } else {
      impacts.push({
        connection_id: cx.connection_id,
        airport: cx.airport,
        from_flight: cx.from_flight,
        to_flight: cx.to_flight,
        passengers: cx.passengers,
        min_connect_minutes: cx.min_connect_minutes,
        sched_window_mins: schedWindow,
        sim_window_mins: simWindow,
        status: 'MAINTAINED',
        reason: `Connection safely made (${simWindow}m available >= ${cx.min_connect_minutes}m min)`
      });
    }
  }

  return impacts;
}
