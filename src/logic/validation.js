// Client-side validation mirroring the server's EntityRules, so coordinators
// get immediate feedback while offline. The server re-validates every synced
// mutation; these checks only prevent obviously invalid work being queued.

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateEvent(data) {
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'Event name must be at least 2 characters';
  if (!data.event_date || !DATE.test(data.event_date)) errors.event_date = 'Date must be YYYY-MM-DD';
  if (!data.start_time || !TIME.test(data.start_time)) errors.start_time = 'Start time must be HH:MM';
  if (data.end_time) {
    if (!TIME.test(data.end_time)) errors.end_time = 'End time must be HH:MM';
    else if (data.start_time && data.end_time <= data.start_time) errors.end_time = 'End time must be after start time';
  }
  for (const key of ['officials_required', 'officials_assigned']) {
    const v = data[key];
    if (v !== null && v !== undefined && v !== '' && (!Number.isInteger(Number(v)) || Number(v) < 0)) errors[key] = 'Must be a whole number';
  }
  return errors;
}

export function validateAthlete(data, siblings = [], selfUuid = null) {
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (data.bib_number !== null && data.bib_number !== undefined) {
    if (!Number.isInteger(data.bib_number) || data.bib_number < 1) errors.bib_number = 'Bib must be a positive number';
    else if (siblings.some((a) => a.uuid !== selfUuid && a.bib_number === data.bib_number)) errors.bib_number = `Bib #${data.bib_number} is already used in this event`;
  }
  if (data.age !== null && data.age !== undefined && (data.age < 5 || data.age > 100)) errors.age = 'Age must be between 5 and 100';
  return errors;
}

export function validateResult(data, eventResults = []) {
  const errors = {};
  if (data.placement !== null && data.placement !== undefined) {
    if (data.placement < 1 || data.placement > 8) errors.placement = 'Placement must be 1-8';
    else if (eventResults.some((r) => r.athlete_uuid !== data.athlete_uuid && r.placement === data.placement)) errors.placement = `Placement ${data.placement} is already taken`;
  }
  if (data.wind_speed !== null && data.wind_speed !== undefined && (Number.isNaN(data.wind_speed) || Math.abs(data.wind_speed) > 20)) errors.wind_speed = 'Wind speed must be between -20 and 20';
  return errors;
}

export function validateDelay(data) {
  const errors = {};
  if (!Number.isInteger(data.delay_minutes) || data.delay_minutes < 1 || data.delay_minutes > 600) errors.delay_minutes = 'Delay must be 1-600 minutes';
  return errors;
}

export function nextBibNumber(athletes) {
  return athletes.reduce((max, a) => Math.max(max, a.bib_number || 0), 0) + 1;
}

export function severityFor(minutes) {
  if (minutes >= 30) return 'critical';
  if (minutes >= 10) return 'major';
  return 'minor';
}

export const firstError = (errors) => Object.values(errors)[0] || null;
