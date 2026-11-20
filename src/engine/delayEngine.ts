import { 
  Flight, 
  DisruptionInput, 
  RecoveryAction, 
  FlightSimResult, 
  DelayDNAStep, 
  FlightStatus 
} from '@/types';
import { timeToMins, minsToTime } from '@/lib/timeUtils';
import { AUTHORITATIVE_DATASET } from '@/data/authoritativeDataset';

export function runDeterministicDelayEngine(
  flights: Flight[],
  disruption: DisruptionInput | null,
  recoveryAction: RecoveryAction | null
): Record<string, FlightSimResult> {
  const minTurnaround = AUTHORITATIVE_DATASET.meta.min_turnaround_minutes;
  const results: Record<string, FlightSimResult> = {};

  // Map crew to flights for lookup
  const flightCrewMap = new Map<string, string>();
  for (const crew of AUTHORITATIVE_DATASET.crews) {
    for (const fid of crew.flight_ids) {
      flightCrewMap.set(fid, crew.crew_id);
    }
  }

  // Pre-process recovery actions (e.g., spare aircraft substitution or aircraft swap)
  // Copy flights list and clone tail assignments
  const activeFlights: (Flight & { current_tail_id: string })[] = flights.map(f => ({
    ...f,
    current_tail_id: f.tail_id
  }));

  // Handle SPARE AIRCRAFT deployment
  if (recoveryAction && recoveryAction.type === 'SPARE_AIRCRAFT' && recoveryAction.flightToReplaceId && recoveryAction.spareTailId) {
    const targetFlight = activeFlights.find(f => f.flight_id === recoveryAction.flightToReplaceId);
    if (targetFlight) {
      const origTail = targetFlight.tail_id;
      // Reassign target flight and subsequent legs of this tail to the spare aircraft
      for (const f of activeFlights) {
        if (f.tail_id === origTail && f.leg_order >= targetFlight.leg_order) {
          f.current_tail_id = recoveryAction.spareTailId;
        }
      }
    }
  }

  // Handle SWAP AIRCRAFT
  if (recoveryAction && recoveryAction.type === 'SWAP_AIRCRAFT' && recoveryAction.swapTailA && recoveryAction.swapTailB && recoveryAction.swapFromFlightId) {
    const swapRef = activeFlights.find(f => f.flight_id === recoveryAction.swapFromFlightId);
    if (swapRef) {
      const legThreshold = swapRef.leg_order;
      for (const f of activeFlights) {
        if (f.tail_id === recoveryAction.swapTailA && f.leg_order >= legThreshold) {
          f.current_tail_id = recoveryAction.swapTailB;
        } else if (f.tail_id === recoveryAction.swapTailB && f.leg_order >= legThreshold) {
          f.current_tail_id = recoveryAction.swapTailA;
        }
      }
    }
  }

  // Group flights by assigned tail_id
  const flightsByTail = new Map<string, typeof activeFlights>();
  for (const f of activeFlights) {
    if (!flightsByTail.has(f.current_tail_id)) {
      flightsByTail.set(f.current_tail_id, []);
    }
    flightsByTail.get(f.current_tail_id)!.push(f);
  }

  // Closure window in minutes
  const closureStart = disruption ? timeToMins(disruption.startTime) : -1;
  const closureEnd = disruption ? closureStart + disruption.durationMins : -1;
  const closedAirport = disruption ? disruption.airportId : null;

  // Process rotations per aircraft
  for (const [tailId, tailFlights] of Array.from(flightsByTail.entries())) {
    // Sort strictly by leg_order
    tailFlights.sort((a, b) => a.leg_order - b.leg_order);

    let prevActualArrMins: number | null = null;
    let prevFlight: FlightSimResult | null = null;

    for (let i = 0; i < tailFlights.length; i++) {
      const flight = tailFlights[i];
      const schedDepMins = timeToMins(flight.dep);
      const schedArrMins = timeToMins(flight.arr);
      const blockMins = flight.block_minutes;
      const turnaroundRequired = flight.turnaround_before_min ?? minTurnaround;
      const crewId = flightCrewMap.get(flight.flight_id) ?? 'UNKNOWN';

      const delayDna: DelayDNAStep[] = [];
      let simDepMins = schedDepMins;
      let primaryCause = 'Scheduled On Time';
      let isCancelled = false;
      let cancellationReason: string | undefined;

      // Check explicit flight cancellation recovery
      if (recoveryAction && recoveryAction.type === 'CANCEL_FLIGHT' && recoveryAction.flightToCancelId === flight.flight_id) {
        isCancelled = true;
        cancellationReason = 'Strategic Operational Cancellation to isolate network delay';
        primaryCause = 'Strategic Flight Cancellation';
        delayDna.push({
          stage: 1,
          type: 'AIRPORT_CLOSURE',
          title: 'Strategic Cancellation',
          description: `Flight ${flight.flight_id} cancelled by Dispatcher to restore downstream aircraft punctuality.`,
          delay_added_mins: 0,
          cumulative_delay_mins: 0,
          flight_id: flight.flight_id,
          airport: flight.origin,
          tail_id: tailId
        });

        results[flight.flight_id] = {
          flight_id: flight.flight_id,
          tail_id: tailId,
          original_tail_id: flight.tail_id,
          leg_order: flight.leg_order,
          origin: flight.origin,
          destination: flight.destination,
          sched_dep: flight.dep,
          sched_arr: flight.arr,
          sim_dep: flight.dep,
          sim_arr: flight.arr,
          sched_dep_mins: schedDepMins,
          sched_arr_mins: schedArrMins,
          sim_dep_mins: schedDepMins,
          sim_arr_mins: schedArrMins,
          dep_delay_mins: 0,
          arr_delay_mins: 0,
          status: 'CANCELLED',
          is_cancelled: true,
          cancellation_reason: cancellationReason,
          primary_cause: primaryCause,
          delay_dna: delayDna,
          turnaround_required_mins: turnaroundRequired,
          turnaround_actual_mins: null,
          pax: flight.pax,
          crew_id: crewId,
          crew_duty_exceeded: false,
          affected_by_closure: false,
          is_recovered: true,
          recovery_action_note: 'Cancelled for delay containment'
        };

        // If cancelled, subsequent flight might use aircraft at original origin, or aircraft stays at origin
        prevActualArrMins = schedDepMins; // aircraft available at station
        continue;
      }

      // Check Spare Aircraft injection note
      if (tailId !== flight.tail_id) {
        delayDna.push({
          stage: 1,
          type: 'SPARE_DEPLOYED',
          title: `Spare Aircraft ${tailId} Substituted`,
          description: `Aircraft swapped from delayed ${flight.tail_id} to spare ${tailId} at ${flight.origin}`,
          delay_added_mins: 0,
          cumulative_delay_mins: 0,
          flight_id: flight.flight_id,
          tail_id: tailId,
          airport: flight.origin
        });
      }

      // 1. Calculate aircraft rotational delay from previous leg
      let turnaroundActualMins: number | null = null;
      if (prevActualArrMins !== null && prevFlight !== null) {
        const earliestFeasibleDep = prevActualArrMins + turnaroundRequired;
        turnaroundActualMins = Math.max(0, earliestFeasibleDep - prevActualArrMins);

        if (earliestFeasibleDep > simDepMins) {
          const rotationDelay = earliestFeasibleDep - simDepMins;
          simDepMins = earliestFeasibleDep;
          primaryCause = `Inbound Aircraft Delay (via ${prevFlight.flight_id} tail ${tailId})`;

          delayDna.push({
            stage: delayDna.length + 1,
            type: 'AIRCRAFT_ROTATION',
            title: `Downstream Rotational Delay (+${rotationDelay}m)`,
            description: `Aircraft ${tailId} arrived from ${prevFlight.flight_id} at ${minsToTime(prevActualArrMins)} (+${prevFlight.arr_delay_mins}m late). Required ${turnaroundRequired}m turnaround forces departure to ${minsToTime(simDepMins)}.`,
            delay_added_mins: rotationDelay,
            cumulative_delay_mins: simDepMins - schedDepMins,
            flight_id: prevFlight.flight_id,
            tail_id: tailId,
            airport: flight.origin
          });
        }
      }

      let affectedByClosure = false;

      // 2. Check Origin Airport Closure
      if (closedAirport && flight.origin === closedAirport) {
        if (simDepMins >= closureStart && simDepMins < closureEnd) {
          const closureWait = closureEnd - simDepMins;
          simDepMins = closureEnd;
          affectedByClosure = true;
          primaryCause = `Origin Airport Closure at ${closedAirport}`;

          delayDna.push({
            stage: delayDna.length + 1,
            type: 'AIRPORT_CLOSURE',
            title: `Origin Closure Ground Stop (+${closureWait}m)`,
            description: `Airport ${closedAirport} closed from ${disruption?.startTime} to ${minsToTime(closureEnd)}. Departure held until reopening.`,
            delay_added_mins: closureWait,
            cumulative_delay_mins: simDepMins - schedDepMins,
            airport: closedAirport,
            flight_id: flight.flight_id,
            tail_id: tailId
          });
        }
      }

      // 3. Check Destination Airport Closure (Ground Delay Program at Origin)
      if (closedAirport && flight.destination === closedAirport) {
        const projectedArr = simDepMins + blockMins;
        if (projectedArr >= closureStart && projectedArr < closureEnd) {
          const arrivalDelay = closureEnd - projectedArr;
          simDepMins += arrivalDelay;
          affectedByClosure = true;
          primaryCause = `Ground Delay Program: Destination ${closedAirport} Closed`;

          delayDna.push({
            stage: delayDna.length + 1,
            type: 'AIRPORT_CLOSURE',
            title: `Ground Delay Program Hold (+${arrivalDelay}m)`,
            description: `Destination ${closedAirport} closed during planned arrival window. Flight held at ${flight.origin} to arrive at reopening (${minsToTime(closureEnd)}).`,
            delay_added_mins: arrivalDelay,
            cumulative_delay_mins: simDepMins - schedDepMins,
            airport: closedAirport,
            flight_id: flight.flight_id,
            tail_id: tailId
          });
        }
      }

      // Simulated arrival
      const simArrMins = simDepMins + blockMins;
      const depDelayMins = Math.max(0, simDepMins - schedDepMins);
      const arrDelayMins = Math.max(0, simArrMins - schedArrMins);

      let status: FlightStatus = 'ON_TIME';
      if (depDelayMins >= 60 || arrDelayMins >= 60) {
        status = 'DELAYED_SEVERE';
      } else if (depDelayMins > 0 || arrDelayMins > 0) {
        status = 'DELAYED_MINOR';
      }

      const isRecovered = tailId !== flight.tail_id && depDelayMins === 0;

      const flightResult: FlightSimResult = {
        flight_id: flight.flight_id,
        tail_id: tailId,
        original_tail_id: flight.tail_id,
        leg_order: flight.leg_order,
        origin: flight.origin,
        destination: flight.destination,
        sched_dep: flight.dep,
        sched_arr: flight.arr,
        sim_dep: minsToTime(simDepMins),
        sim_arr: minsToTime(simArrMins),
        sched_dep_mins: schedDepMins,
        sched_arr_mins: schedArrMins,
        sim_dep_mins: simDepMins,
        sim_arr_mins: simArrMins,
        dep_delay_mins: depDelayMins,
        arr_delay_mins: arrDelayMins,
        status,
        is_cancelled: false,
        primary_cause: primaryCause,
        delay_dna: delayDna,
        turnaround_required_mins: turnaroundRequired,
        turnaround_actual_mins: turnaroundActualMins,
        pax: flight.pax,
        crew_id: crewId,
        crew_duty_exceeded: false, // will be populated in crew engine
        affected_by_closure: affectedByClosure,
        is_recovered: isRecovered,
        recovery_action_note: isRecovered ? `Operated by spare ${tailId}` : undefined
      };

      results[flight.flight_id] = flightResult;
      prevActualArrMins = simArrMins;
      prevFlight = flightResult;
    }
  }

  return results;
}
