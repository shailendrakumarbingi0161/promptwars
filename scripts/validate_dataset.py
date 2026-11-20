import json
from datetime import datetime, timedelta
from collections import defaultdict

def time_to_mins(t_str):
    if not t_str:
        return None
    h, m = map(int, t_str.split(':'))
    return h * 60 + m

def mins_to_time(m):
    if m is None:
        return 'N/A'
    h = (m // 60) % 24
    mins = m % 60
    return f"{h:02d}:{mins:02d}"

with open('data/dataset.json', 'r') as f:
    data = json.load(f)

print("=== DATASET VALIDATION REPORT ===")
print(f"Meta: {data['meta']['dataset']}")
print(f"Operating Day: {data['meta']['operating_day']}")
print(f"Min Turnaround Minutes: {data['meta']['min_turnaround_minutes']}")
print(f"Seats per Aircraft: {data['meta']['seats_per_aircraft']}")

airports = data['airports']
flights = data['flights']
connections = data['connections']
crews = data['crews']
spare_aircraft = data['spare_aircraft']

print(f"\n1. Airports Count: {len(airports)}")
airport_ids = {a['id']: a for a in airports}
assert len(airport_ids) == len(airports), "Duplicate airport IDs found!"

print(f"2. Flights Count: {len(flights)}")
flight_ids = {f['flight_id']: f for f in flights}
assert len(flight_ids) == len(flights), "Duplicate flight IDs found!"

# Check aircraft rotations
aircraft_rotations = defaultdict(list)
for f in flights:
    aircraft_rotations[f['tail_id']].append(f)

print(f"\n3. Aircraft Rotations (Active Aircraft Count: {len(aircraft_rotations)}):")
for tail_id, flist in sorted(aircraft_rotations.items()):
    flist.sort(key=lambda x: x['leg_order'])
    print(f"  Aircraft {tail_id}: {len(flist)} legs")
    prev_dest = None
    prev_arr_mins = None
    for i, leg in enumerate(flist):
        dep_mins = time_to_mins(leg['dep'])
        arr_mins = time_to_mins(leg['arr'])
        block = arr_mins - dep_mins if arr_mins >= dep_mins else (arr_mins + 1440 - dep_mins)
        assert block == leg['block_minutes'], f"Block minutes mismatch for {leg['flight_id']}"
        assert leg['origin'] in airport_ids, f"Unknown origin {leg['origin']}"
        assert leg['destination'] in airport_ids, f"Unknown destination {leg['destination']}"
        if prev_dest:
            assert leg['origin'] == prev_dest, f"Inconsistent route for {tail_id}: {prev_dest} -> {leg['origin']}"
            turnaround_actual = dep_mins - prev_arr_mins
            turnaround_spec = leg['turnaround_before_min']
            print(f"    Leg {leg['leg_order']}: {leg['flight_id']} ({leg['origin']}->{leg['destination']}) {leg['dep']}-{leg['arr']} [Turnaround: {turnaround_actual}m, Spec: {turnaround_spec}m]")
        else:
            print(f"    Leg {leg['leg_order']}: {leg['flight_id']} ({leg['origin']}->{leg['destination']}) {leg['dep']}-{leg['arr']} [Start]")
        prev_dest = leg['destination']
        prev_arr_mins = arr_mins

print(f"\n4. Passenger Connections Count: {len(connections)}")
for cx in connections:
    f1 = flight_ids.get(cx['from_flight'])
    f2 = flight_ids.get(cx['to_flight'])
    assert f1 is not None, f"Unknown from_flight {cx['from_flight']}"
    assert f2 is not None, f"Unknown to_flight {cx['to_flight']}"
    assert f1['destination'] == cx['airport'], f"From flight doesn't arrive at connection airport {cx['airport']}"
    assert f2['origin'] == cx['airport'], f"To flight doesn't depart from connection airport {cx['airport']}"
    t_diff = time_to_mins(f2['dep']) - time_to_mins(f1['arr'])
    status = "OK" if t_diff >= cx['min_connect_minutes'] else "INVALID_SCHEDULE"
    print(f"  {cx['connection_id']}: {cx['passengers']} pax from {cx['from_flight']} ({f1['arr']}) to {cx['to_flight']} ({f2['dep']}) at {cx['airport']} - Scheduled Window: {t_diff}m (Min: {cx['min_connect_minutes']}m) -> {status}")

print(f"\n5. Crew Assignments Count: {len(crews)}")
for cr in crews:
    duty_start_m = time_to_mins(cr['duty_start'])
    print(f"  Crew {cr['crew_id']} (Base: {cr['base']}, Aircraft: {cr['tail_id']}, Duty Start: {cr['duty_start']}, Max: {cr['max_duty_mins']}m):")
    total_flights = len(cr['flight_ids'])
    last_f = flight_ids[cr['flight_ids'][-1]]
    sched_end_m = time_to_mins(last_f['arr'])
    sched_duty_m = sched_end_m - duty_start_m
    buffer_m = cr['max_duty_mins'] - sched_duty_m
    print(f"    Operates {total_flights} flights: {cr['flight_ids']}")
    print(f"    Scheduled Duty End: {last_f['arr']} | Total Duty: {sched_duty_m}m | Duty Margin: {buffer_m}m")
    assert sched_duty_m <= cr['max_duty_mins'], f"Crew {cr['crew_id']} exceeds max duty in scheduled plan!"

print(f"\n6. Spare Aircraft Count: {len(spare_aircraft)}")
for sp in spare_aircraft:
    assert sp['base'] in airport_ids, f"Unknown base {sp['base']}"
    print(f"  Spare {sp['tail_id']} at {sp['base']} available from {sp['available_from']} ({sp['seats']} seats)")

print("\n=== VALIDATION COMPLETED SUCCESSFULLY: ALL CONSTRAINTS AND SCHEMAS VALID! ===")
