// Standings and medal tally computed on the device, so they stay correct and
// up to date while offline. Mirrors App\Services\StandingsService exactly:
// 1st = 5 pts (gold), 2nd = 3 pts (silver), 3rd = 1 pt (bronze).

export const POINTS = { 1: 5, 2: 3, 3: 1 };
const MEDALS = { 1: 'gold', 2: 'silver', 3: 'bronze' };

function tally(results, athletesByUuid) {
  const table = {};
  for (const r of results) {
    if (!r.placement) continue;
    const athlete = athletesByUuid[r.athlete_uuid];
    const house = (athlete && athlete.house) || 'Unassigned';
    if (!table[house]) table[house] = { house, gold: 0, silver: 0, bronze: 0, points: 0 };
    if (MEDALS[r.placement]) table[house][MEDALS[r.placement]] += 1;
    table[house].points += POINTS[r.placement] || 0;
  }
  return Object.values(table).sort((a, b) =>
    (b.gold - a.gold) || (b.silver - a.silver) || (b.bronze - a.bronze) || (b.points - a.points));
}

export function indexByUuid(list) {
  const out = {};
  for (const item of list) out[item.uuid] = item;
  return out;
}

/** Standings for one event. */
export function eventStandings(eventUuid, results, athletes) {
  const byUuid = indexByUuid(athletes);
  const eventResults = results.filter((r) => r.event_uuid === eventUuid && r.placement);
  const rankings = [...eventResults]
    .sort((a, b) => a.placement - b.placement)
    .map((r) => ({ ...r, athlete: byUuid[r.athlete_uuid] || null }));
  const medalTable = tally(eventResults, byUuid);
  const housePoints = {};
  for (const row of medalTable) housePoints[row.house] = row.points;
  return { rankings, medalTable, housePoints };
}

/** Overall medal table across every event. */
export function overallMedalTable(results, athletes) {
  return tally(results, indexByUuid(athletes));
}
