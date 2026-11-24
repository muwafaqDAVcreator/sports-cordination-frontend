// Local-first write path (FR4). Every coordinator action is:
//   1. validated locally,
//   2. written to the on-device database immediately (durable before any
//      network activity), and
//   3. appended to the sync queue for the sync engine to upload.
// The UI therefore behaves identically online and offline.

import * as db from './localDb';
import { buildMutation } from '../logic/syncLogic';
import { uuidv4 } from '../logic/uuid';
import {
  validateEvent, validateAthlete, validateResult, validateDelay,
  nextBibNumber, severityFor, firstError,
} from '../logic/validation';

export class ValidationError extends Error {
  constructor(errors) {
    super(firstError(errors) || 'Invalid input');
    this.errors = errors;
  }
}

const check = (errors) => {
  if (Object.keys(errors).length) throw new ValidationError(errors);
};

async function commit(entity, table, op, record, changes) {
  const mutation = buildMutation(entity, op, record, changes);
  if (op === 'delete') {
    await db.remove(table, record.uuid);
  } else {
    await db.put(table, { ...record, ...changes, updated_at: mutation.client_updated_at, _pending: true, _syncError: null });
  }
  await db.addMutation(mutation);
  return mutation;
}

const clean = (v) => (v === '' || v === undefined ? null : v);

// ---------------------------------------------------------------- events

export async function saveEvent(data, existing = null) {
  const fields = {
    name: data.name?.trim(),
    discipline: clean(data.discipline),
    event_date: data.event_date,
    start_time: data.start_time,
    end_time: clean(data.end_time),
    venue: clean(data.venue),
    officials_required: data.officials_required === '' || data.officials_required == null ? 0 : Number(data.officials_required),
    officials_assigned: data.officials_assigned === '' || data.officials_assigned == null ? 0 : Number(data.officials_assigned),
  };
  check(validateEvent(fields));

  if (existing) {
    await commit('event', 'events', 'update', existing, fields);
    return { ...existing, ...fields };
  }
  const record = { uuid: uuidv4(), id: null, status: 'upcoming', actual_start_time: null, ...fields };
  await commit('event', 'events', 'create', record, {});
  return record;
}

export async function setEventStatus(event, status) {
  const changes = { status };
  if (status === 'running' && !event.actual_start_time) {
    const now = new Date();
    changes.actual_start_time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  await commit('event', 'events', 'update', event, changes);
}

export async function deleteEvent(event) {
  await commit('event', 'events', 'delete', event);
  // Children go with the event locally, exactly as the server cascades.
  for (const table of ['athletes', 'results', 'delays']) {
    for (const child of (await db.getAll(table)).filter((r) => r.event_uuid === event.uuid)) {
      await db.remove(table, child.uuid);
    }
  }
}

export async function logDelay(event, minutes, reason) {
  const data = { delay_minutes: Number(minutes), reason: clean(reason) };
  check(validateDelay(data));
  const record = {
    uuid: uuidv4(), id: null, event_uuid: event.uuid, ...data,
    severity: severityFor(data.delay_minutes), created_at: new Date().toISOString(),
  };
  await commit('delay', 'delays', 'create', record, {});
  return record;
}

// ---------------------------------------------------------------- athletes

export async function saveAthlete(eventUuid, data, existing = null) {
  const siblings = (await db.getAll('athletes')).filter((a) => a.event_uuid === eventUuid);
  const fields = {
    name: data.name?.trim(),
    bib_number: data.bib_number === '' || data.bib_number == null ? null : Number(data.bib_number),
    age: data.age === '' || data.age == null ? null : Number(data.age),
    house: clean(data.house?.trim?.() ?? data.house),
  };
  if (!existing && fields.bib_number === null) fields.bib_number = nextBibNumber(siblings);
  check(validateAthlete(fields, siblings, existing?.uuid));

  if (existing) {
    await commit('athlete', 'athletes', 'update', existing, fields);
    return { ...existing, ...fields };
  }
  const record = { uuid: uuidv4(), id: null, event_uuid: eventUuid, ...fields };
  await commit('athlete', 'athletes', 'create', record, {});
  return record;
}

export async function deleteAthlete(athlete) {
  const hasResult = (await db.getAll('results')).some((r) => r.athlete_uuid === athlete.uuid);
  if (hasResult) throw new ValidationError({ athlete: 'Athlete has recorded results and cannot be deleted' });
  await commit('athlete', 'athletes', 'delete', athlete);
}

// ---------------------------------------------------------------- results

export async function saveResult(eventUuid, athleteUuid, data) {
  const eventResults = (await db.getAll('results')).filter((r) => r.event_uuid === eventUuid);
  const fields = {
    placement: data.placement ?? null,
    time: clean(data.time),
    wind_speed: data.wind_speed === '' || data.wind_speed == null ? null : Number(data.wind_speed),
    notes: clean(data.notes),
  };
  check(validateResult({ ...fields, athlete_uuid: athleteUuid }, eventResults));

  // One result per athlete per event: update in place if one exists.
  const existing = eventResults.find((r) => r.athlete_uuid === athleteUuid);
  if (existing) {
    await commit('result', 'results', 'update', existing, fields);
    return { ...existing, ...fields };
  }
  const record = { uuid: uuidv4(), id: null, event_uuid: eventUuid, athlete_uuid: athleteUuid, ...fields };
  await commit('result', 'results', 'create', record, {});
  return record;
}

export async function deleteResult(result) {
  await commit('result', 'results', 'delete', result);
}
