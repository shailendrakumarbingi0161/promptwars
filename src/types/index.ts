export type AirportTier = 'mega_hub' | 'regional_hub' | 'spoke';

export interface Airport {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  tier: AirportTier;
  capacity_per_hour: number;
}

export interface Flight {
  flight_id: string;
  tail_id: string;
  leg_order: number;
  origin: string;
  destination: string;
  dep: string;
  arr: string;
  block_minutes: number;
  pax: number;
  turnaround_before_min: number | null;
}

export interface Connection {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  min_connect_minutes: number;
}

export interface Crew {
  crew_id: string;
  tail_id: string;
  base: string;
  duty_start: string;
  max_duty_mins: number;
  flight_ids: string[];
}

export interface SpareAircraft {
  tail_id: string;
  base: string;
  available_from: string;
  seats: number;
}

export interface DatasetMeta {
  dataset: string;
  operating_day: string;
  min_turnaround_minutes: number;
  seats_per_aircraft: number;
  notes: string[];
}

export interface AirlineDataset {
  meta: DatasetMeta;
  airports: Airport[];
  flights: Flight[];
  connections: Connection[];
  crews: Crew[];
  spare_aircraft: SpareAircraft[];
}

export type FlightStatus = 'ON_TIME' | 'DELAYED_MINOR' | 'DELAYED_SEVERE' | 'CANCELLED';

export interface DelayDNAStep {
  stage: number;
  type: 'AIRPORT_CLOSURE' | 'AIRCRAFT_ROTATION' | 'TURNAROUND_DEFICIT' | 'PASSENGER_MISCONNECT' | 'CREW_TIMEOUT' | 'SPARE_DEPLOYED' | 'SWAP_APPLIED';
  title: string;
  description: string;
  delay_added_mins: number;
  cumulative_delay_mins: number;
  flight_id?: string;
  airport?: string;
  tail_id?: string;
  timestamp?: string;
}

export interface FlightSimResult {
  flight_id: string;
  tail_id: string;
  original_tail_id: string;
  leg_order: number;
  origin: string;
  destination: string;
  sched_dep: string;
  sched_arr: string;
  sim_dep: string;
  sim_arr: string;
  sched_dep_mins: number;
  sched_arr_mins: number;
  sim_dep_mins: number;
  sim_arr_mins: number;
  dep_delay_mins: number;
  arr_delay_mins: number;
  status: FlightStatus;
  is_cancelled: boolean;
  cancellation_reason?: string;
  primary_cause: string;
  delay_dna: DelayDNAStep[];
  turnaround_required_mins: number;
  turnaround_actual_mins: number | null;
  pax: number;
  crew_id: string;
  crew_duty_exceeded: boolean;
  affected_by_closure: boolean;
  is_recovered: boolean;
  recovery_action_note?: string;
}

export interface PassengerImpactResult {
  connection_id: string;
  airport: string;
  from_flight: string;
  to_flight: string;
  passengers: number;
  min_connect_minutes: number;
  sched_window_mins: number;
  sim_window_mins: number;
  status: 'MAINTAINED' | 'MISSED_STRANDED' | 'CANCELLED_STRANDED';
  reason: string;
}

export interface CrewImpactResult {
  crew_id: string;
  tail_id: string;
  base: string;
  duty_start: string;
  duty_start_mins: number;
  sched_end: string;
  sim_end: string;
  sched_duty_mins: number;
  sim_duty_mins: number;
  max_duty_mins: number;
  margin_mins: number;
  violated: boolean;
  flights_operated: string[];
}

export interface SimulationMetrics {
  total_flights: number;
  on_time_flights: number;
  delayed_flights: number;
  cancelled_flights: number;
  total_dep_delay_mins: number;
  total_arr_delay_mins: number;
  avg_delay_mins: number;
  max_delay_mins: number;
  affected_aircraft: number;
  total_passengers: number;
  affected_passengers: number;
  missed_connections: number;
  stranded_passengers: number;
  crew_violations: number;
  recovered_flights: number;
}

export interface DisruptionInput {
  airportId: string;
  startTime: string; // HH:MM
  durationMins: number;
}

export type RecoveryStrategyType = 
  | 'NONE'
  | 'SPARE_AIRCRAFT'
  | 'CANCEL_FLIGHT'
  | 'SWAP_AIRCRAFT'
  | 'COMBINED';

export interface RecoveryAction {
  type: RecoveryStrategyType;
  spareTailId?: string;
  targetTailId?: string;
  spareAvailableAirport?: string;
  flightToReplaceId?: string;
  flightToCancelId?: string;
  swapTailA?: string;
  swapTailB?: string;
  swapAirport?: string;
  swapFromFlightId?: string;
  notes?: string;
}

export interface SimulationResult {
  id: string;
  disruption: DisruptionInput;
  recoveryAction?: RecoveryAction;
  flights: Record<string, FlightSimResult>;
  flightList: FlightSimResult[];
  passengerImpacts: PassengerImpactResult[];
  crewImpacts: CrewImpactResult[];
  metrics: SimulationMetrics;
  eventsChronological: SimulationEvent[];
}

export interface SimulationEvent {
  id: string;
  timeMins: number;
  timeStr: string;
  type: 'CLOSURE_START' | 'CLOSURE_END' | 'FLIGHT_DEP' | 'FLIGHT_ARR' | 'DELAY_TRIGGER' | 'CONNECTION_BREAK' | 'CREW_LIMIT' | 'RECOVERY_APPLIED';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  flight_id?: string;
  airport?: string;
}

export interface AIDispatcherRecommendation {
  id: string;
  strategy: RecoveryStrategyType;
  title: string;
  summary: string;
  action: RecoveryAction;
  rank: number;
  confidenceScore: number;
  rationale: string;
  tradeOffs: string[];
  constraintsChecked: {
    rule: string;
    passed: boolean;
    details: string;
  }[];
  predictedImpact: {
    delayReductionMins: number;
    paxSaved: number;
    crewViolationsAvoided: number;
  };
}
