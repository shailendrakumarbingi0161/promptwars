import { z } from 'zod';

// ==========================================
// 1. SMART SPARE AIRCRAFT ALLOCATION SCHEMAS
// ==========================================

export const ConstraintCheckSchema = z.object({
  rule: z.string(),
  passed: z.boolean(),
  details: z.string(),
});

export const SpareAllocationCandidateSchema = z.object({
  id: z.string(),
  spareTailId: z.string(),
  targetFlightId: z.string(),
  originalTailId: z.string(),
  currentAirport: z.string(),
  targetAirport: z.string(),
  positioningRequired: z.boolean(),
  positioningTimeMins: z.number(),
  spareReadinessTime: z.string(),
  originalFlightDelayMins: z.number(),
  revisedFlightDelayMins: z.number(),
  delayReductionMins: z.number(),
  passengersProtected: z.number(),
  crewFeasible: z.boolean(),
  crewViolationAvoided: z.boolean(),
  allocationScore: z.number(),
  status: z.enum(['OPTIMAL', 'FEASIBLE', 'SUBOPTIMAL', 'INFEASIBLE']),
  operationalRationale: z.string(),
  constraintsChecked: z.array(ConstraintCheckSchema),
});

export type SpareAllocationCandidate = z.infer<typeof SpareAllocationCandidateSchema>;

// ==========================================
// 2. NETWORK VULNERABILITY HEAT MAP SCHEMAS
// ==========================================

export const VulnerabilityWeightsSchema = z.object({
  degree: z.number().min(0).max(1),
  betweenness: z.number().min(0).max(1),
  rotation: z.number().min(0).max(1),
  passenger: z.number().min(0).max(1),
  alternative: z.number().min(0).max(1),
  recovery: z.number().min(0).max(1),
});

export type VulnerabilityWeights = z.infer<typeof VulnerabilityWeightsSchema>;

export const AirportVulnerabilityMetricsSchema = z.object({
  airportId: z.string(),
  airportName: z.string(),
  city: z.string(),
  tier: z.string(),
  lat: z.number(),
  lng: z.number(),
  degreeCentrality: z.number(), // [0, 1]
  betweennessCentrality: z.number(), // [0, 1]
  rotationDependency: z.number(), // [0, 1]
  passengerDependency: z.number(), // [0, 1]
  alternativeConnectivity: z.number(), // [0, 1]
  recoveryDifficulty: z.number(), // [0, 1]
  compositeVulnerabilityScore: z.number().min(0).max(100),
  vulnerabilityLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  affectedRotationsCount: z.number(),
  connectingPassengersCount: z.number(),
  totalDirectConnections: z.number(),
  hubRampSpareAvailable: z.boolean(),
  simulatedClosureImpact: z.object({
    totalNetworkDelayMins: z.number(),
    delayedFlightsCount: z.number(),
    strandedPassengersCount: z.number(),
    crewViolationsCount: z.number(),
  }),
});

export type AirportVulnerabilityMetrics = z.infer<typeof AirportVulnerabilityMetricsSchema>;

// ==========================================
// 3. DOMINO REPLAY TIMELINE SCHEMAS
// ==========================================

export const ReplayEventCategorySchema = z.enum([
  'AIRPORT_CLOSURE',
  'AIRPORT_REOPEN',
  'FLIGHT_DELAY',
  'ROTATION_PROPAGATION',
  'PASSENGER_MISCONNECT',
  'CREW_DUTY_TIMEOUT',
  'SPARE_ALLOCATED',
  'FLIGHT_CANCELLED',
  'RECOVERY_COMPLETED'
]);

export type ReplayEventCategory = z.infer<typeof ReplayEventCategorySchema>;

export const ReplaySnapshotSchema = z.object({
  timeMins: z.number(),
  timeStr: z.string(),
  activeAirborneCount: z.number(),
  cumulativeDelayMins: z.number(),
  strandedPassengersCount: z.number(),
  crewViolationsCount: z.number(),
  activeEventIds: z.array(z.string()),
});

export type ReplaySnapshot = z.infer<typeof ReplaySnapshotSchema>;
