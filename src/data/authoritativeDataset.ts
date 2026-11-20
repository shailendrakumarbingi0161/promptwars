import { AirlineDataset } from '@/types';
import datasetJson from '../../data/dataset.json';

export const AUTHORITATIVE_DATASET: AirlineDataset = datasetJson as AirlineDataset;

export const AIRPORTS_MAP = new Map(AUTHORITATIVE_DATASET.airports.map(a => [a.id, a]));
export const FLIGHTS_MAP = new Map(AUTHORITATIVE_DATASET.flights.map(f => [f.flight_id, f]));
export const CREWS_MAP = new Map(AUTHORITATIVE_DATASET.crews.map(c => [c.crew_id, c]));
export const CONNECTIONS_LIST = AUTHORITATIVE_DATASET.connections;
export const SPARE_AIRCRAFT_LIST = AUTHORITATIVE_DATASET.spare_aircraft;
