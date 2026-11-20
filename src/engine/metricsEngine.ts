import { 
  FlightSimResult, 
  PassengerImpactResult, 
  CrewImpactResult, 
  SimulationMetrics 
} from '@/types';

export function calculateSimulationMetrics(
  flightResults: Record<string, FlightSimResult>,
  passengerImpacts: PassengerImpactResult[],
  crewImpacts: CrewImpactResult[]
): SimulationMetrics {
  const flightList = Object.values(flightResults);
  const totalFlights = flightList.length;

  let delayedFlights = 0;
  let cancelledFlights = 0;
  let onTimeFlights = 0;
  let totalDepDelay = 0;
  let totalArrDelay = 0;
  let maxDelay = 0;
  let recoveredFlights = 0;

  const affectedAircraftSet = new Set<string>();

  for (const f of flightList) {
    if (f.is_cancelled) {
      cancelledFlights++;
      affectedAircraftSet.add(f.tail_id);
      continue;
    }

    if (f.is_recovered) {
      recoveredFlights++;
    }

    if (f.dep_delay_mins > 0 || f.arr_delay_mins > 0) {
      delayedFlights++;
      affectedAircraftSet.add(f.tail_id);
    } else {
      onTimeFlights++;
    }

    totalDepDelay += f.dep_delay_mins;
    totalArrDelay += f.arr_delay_mins;

    if (f.dep_delay_mins > maxDelay) maxDelay = f.dep_delay_mins;
    if (f.arr_delay_mins > maxDelay) maxDelay = f.arr_delay_mins;
  }

  const avgDelay = delayedFlights > 0 ? Math.round(totalDepDelay / delayedFlights) : 0;

  // Passenger metrics
  let missedConnections = 0;
  let strandedPax = 0;
  let affectedPax = 0;

  for (const p of passengerImpacts) {
    if (p.status === 'MISSED_STRANDED' || p.status === 'CANCELLED_STRANDED') {
      missedConnections++;
      strandedPax += p.passengers;
      affectedPax += p.passengers;
    }
  }

  // Also include passengers on cancelled or delayed flights in affectedPax
  for (const f of flightList) {
    if (f.is_cancelled) {
      affectedPax += f.pax;
    } else if (f.dep_delay_mins >= 30) {
      affectedPax += f.pax;
    }
  }

  // Total passengers across all flights
  const totalPassengers = flightList.reduce((acc, f) => acc + f.pax, 0);

  // Crew violations
  const crewViolations = crewImpacts.filter(c => c.violated).length;

  return {
    total_flights: totalFlights,
    on_time_flights: onTimeFlights,
    delayed_flights: delayedFlights,
    cancelled_flights: cancelledFlights,
    total_dep_delay_mins: totalDepDelay,
    total_arr_delay_mins: totalArrDelay,
    avg_delay_mins: avgDelay,
    max_delay_mins: maxDelay,
    affected_aircraft: affectedAircraftSet.size,
    total_passengers: totalPassengers,
    affected_passengers: affectedPax,
    missed_connections: missedConnections,
    stranded_passengers: strandedPax,
    crew_violations: crewViolations,
    recovered_flights: recoveredFlights
  };
}
