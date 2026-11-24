import { eventStandings, overallMedalTable } from '../src/logic/standings';
import { validateEvent, validateAthlete, validateResult, validateDelay, nextBibNumber, severityFor } from '../src/logic/validation';

const athletes = [
  { uuid: 'r1', name: 'Red One', house: 'Red' },
  { uuid: 'b1', name: 'Blue One', house: 'Blue' },
  { uuid: 'r2', name: 'Red Two', house: 'Red' },
  { uuid: 'n1', name: 'No House', house: null },
];

describe('standings (mirrors the server StandingsService)', () => {
  const results = [
    { uuid: 'x1', event_uuid: 'e', athlete_uuid: 'b1', placement: 1 },
    { uuid: 'x2', event_uuid: 'e', athlete_uuid: 'r1', placement: 2 },
    { uuid: 'x3', event_uuid: 'e', athlete_uuid: 'r2', placement: 3 },
    { uuid: 'x4', event_uuid: 'e', athlete_uuid: 'n1', placement: 4 },
    { uuid: 'x5', event_uuid: 'other', athlete_uuid: 'r1', placement: 1 },
  ];

  it('scores 5/3/1 and builds the medal table for one event', () => {
    const s = eventStandings('e', results, athletes);
    expect(s.housePoints).toEqual({ Blue: 5, Red: 4, Unassigned: 0 });
    expect(s.medalTable[0]).toEqual({ house: 'Blue', gold: 1, silver: 0, bronze: 0, points: 5 });
    expect(s.medalTable[1]).toEqual({ house: 'Red', gold: 0, silver: 1, bronze: 1, points: 4 });
    expect(s.rankings.map((r) => r.athlete.name)).toEqual(['Blue One', 'Red One', 'Red Two', 'No House']);
  });

  it('orders the overall table by gold, then silver, then bronze', () => {
    const table = overallMedalTable(results, athletes);
    expect(table.map((r) => r.house)).toEqual(['Red', 'Blue', 'Unassigned']);
    expect(table[0]).toMatchObject({ gold: 1, silver: 1, bronze: 1, points: 9 });
  });

  it('ignores results without a placement', () => {
    expect(eventStandings('e', [{ uuid: 'z', event_uuid: 'e', athlete_uuid: 'b1', placement: null }], athletes).medalTable).toEqual([]);
  });
});

describe('client validation (mirrors server EntityRules)', () => {
  it('requires a name, date and start time for events', () => {
    expect(Object.keys(validateEvent({}))).toEqual(expect.arrayContaining(['name', 'event_date', 'start_time']));
    expect(validateEvent({ name: '100m', event_date: '2026-11-24', start_time: '09:00' })).toEqual({});
  });

  it('rejects an end time before the start time (T11)', () => {
    expect(validateEvent({ name: '100m', event_date: '2026-11-24', start_time: '10:00', end_time: '09:00' }).end_time).toMatch(/after/);
  });

  it('rejects a duplicate bib within the event, but not for the athlete itself (T14)', () => {
    const siblings = [{ uuid: 'a', bib_number: 7 }];
    expect(validateAthlete({ name: 'New', bib_number: 7 }, siblings).bib_number).toMatch(/already used/);
    expect(validateAthlete({ name: 'Same', bib_number: 7 }, siblings, 'a')).toEqual({});
  });

  it('rejects a placement already taken by another athlete', () => {
    const existing = [{ athlete_uuid: 'a', placement: 1 }];
    expect(validateResult({ athlete_uuid: 'b', placement: 1 }, existing).placement).toMatch(/taken/);
    expect(validateResult({ athlete_uuid: 'a', placement: 1 }, existing)).toEqual({});
    expect(validateResult({ athlete_uuid: 'b', placement: 9 }, []).placement).toBeDefined();
  });

  it('validates delays and maps severity bands like the server', () => {
    expect(validateDelay({ delay_minutes: 0 }).delay_minutes).toBeDefined();
    expect(validateDelay({ delay_minutes: 12 })).toEqual({});
    expect([severityFor(9), severityFor(10), severityFor(30)]).toEqual(['minor', 'major', 'critical']);
  });

  it('auto-assigns the next free bib number', () => {
    expect(nextBibNumber([])).toBe(1);
    expect(nextBibNumber([{ bib_number: 3 }, { bib_number: 11 }, { bib_number: null }])).toBe(12);
  });
});
