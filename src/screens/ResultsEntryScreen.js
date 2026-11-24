import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectAthletesFor, selectResultsFor, selectEvent } from '../redux/dataSlice';
import { saveResult } from '../redux/actions';
import { colors } from '../theme';

const PLACEMENTS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Trackside results capture, optimised for speed: pick athlete, place, Save & Next. */
export default function ResultsEntryScreen({ route, navigation }) {
  const { eventUuid } = route.params;
  const dispatch = useDispatch();
  const event = useSelector(selectEvent(eventUuid));
  const athletes = useSelector(selectAthletesFor(eventUuid));
  const results = useSelector(selectResultsFor(eventUuid));
  const { isOnline } = useSelector((s) => s.sync);

  const [selected, setSelected] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [time, setTime] = useState('');
  const [wind, setWind] = useState('');

  const resultFor = useMemo(() => {
    const map = {};
    for (const r of results) map[r.athlete_uuid] = r;
    return map;
  }, [results]);

  const taken = results.filter((r) => r.placement && r.athlete_uuid !== selected?.uuid).map((r) => r.placement);

  const select = (athlete) => {
    const existing = resultFor[athlete.uuid];
    setSelected(athlete);
    setPlacement(existing?.placement ?? null);
    setTime(existing?.time || '');
    setWind(existing?.wind_speed != null ? String(existing.wind_speed) : '');
  };

  const saveAndNext = async () => {
    if (!selected) return;
    try {
      await dispatch(saveResult(eventUuid, selected.uuid, { placement, time, wind_speed: wind }));
      const next = athletes.find((a) => a.uuid !== selected.uuid && !resultFor[a.uuid]);
      if (next) select(next);
      else {
        setSelected(null);
        Alert.alert('All results entered', 'View the standings?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Standings', onPress: () => navigation.navigate('Standings', { eventUuid }) },
        ]);
      }
    } catch (err) {
      Alert.alert('Cannot save result', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>{event?.name}</Text>
        <Text style={styles.progressText}>{results.length} of {athletes.length} results entered</Text>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${athletes.length ? (results.length / athletes.length) * 100 : 0}%` }]} /></View>
        {!isOnline && <Text style={styles.offline}>📴 Offline - results are saved on this device and will sync automatically.</Text>}
      </View>

      <Text style={styles.section}>Select athlete</Text>
      <View style={styles.athleteGrid}>
        {athletes.map((a) => {
          const r = resultFor[a.uuid];
          const active = selected?.uuid === a.uuid;
          return (
            <TouchableOpacity key={a.uuid} style={[styles.athlete, r && styles.athleteDone, active && styles.athleteActive]} onPress={() => select(a)} accessibilityLabel={`Bib ${a.bib_number} ${a.name}`}>
              <Text style={[styles.athleteBib, active && { color: '#fff' }]}>#{a.bib_number ?? '–'}</Text>
              <Text style={[styles.athleteName, active && { color: '#fff' }]} numberOfLines={1}>{a.name}</Text>
              {r ? <Text style={[styles.athletePlace, active && { color: '#fff' }]}>{r.placement ? `P${r.placement}` : '✓'}{r._pending ? ' ⏳' : ''}</Text> : null}
            </TouchableOpacity>
          );
        })}
        {athletes.length === 0 && <Text style={styles.empty}>Register athletes first.</Text>}
      </View>

      {selected && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>#{selected.bib_number} {selected.name} · {selected.house || 'No house'}</Text>
          <Text style={styles.label}>Placement</Text>
          <View style={styles.places}>
            {PLACEMENTS.map((p) => {
              const isTaken = taken.includes(p);
              return (
                <TouchableOpacity key={p} disabled={isTaken} onPress={() => setPlacement(placement === p ? null : p)}
                  style={[styles.place, placement === p && styles.placeActive, isTaken && styles.placeTaken]} accessibilityLabel={`Place ${p}${isTaken ? ' taken' : ''}`}>
                  <Text style={[styles.placeText, placement === p && { color: '#fff' }]}>{p}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Time / mark</Text>
              <TextInput style={styles.input} placeholder="00:11.20" value={time} onChangeText={setTime} accessibilityLabel="Time" />
            </View>
            <View style={{ width: 110 }}>
              <Text style={styles.label}>Wind (m/s)</Text>
              <TextInput style={styles.input} placeholder="+1.2" value={wind} onChangeText={setWind} keyboardType="numbers-and-punctuation" accessibilityLabel="Wind speed" />
            </View>
          </View>
          <TouchableOpacity style={styles.save} onPress={saveAndNext} accessibilityRole="button">
            <Text style={styles.saveText}>Save & Next</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.standings} onPress={() => navigation.navigate('Standings', { eventUuid })}>
        <Text style={styles.standingsText}>🏆 View Standings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  progressText: { fontSize: 13, color: colors.muted, marginTop: 4 },
  progress: { height: 6, backgroundColor: '#EEF0F3', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.success },
  offline: { marginTop: 10, fontSize: 12, color: colors.warning, fontWeight: '700' },
  section: { fontSize: 14, fontWeight: '800', color: colors.text, marginHorizontal: 16, marginTop: 14 },
  athleteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  athlete: { width: '31%', backgroundColor: colors.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border },
  athleteDone: { borderColor: colors.success, backgroundColor: colors.successBg },
  athleteActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  athleteBib: { fontSize: 12, fontWeight: '800', color: colors.primary },
  athleteName: { fontSize: 12, color: colors.text, marginTop: 2 },
  athletePlace: { fontSize: 11, fontWeight: '800', color: colors.success, marginTop: 2 },
  empty: { color: colors.muted },
  form: { backgroundColor: colors.card, margin: 16, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 8 },
  formTitle: { fontSize: 15, fontWeight: '800', color: colors.primary },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  places: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  place: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  placeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  placeTaken: { opacity: 0.25 },
  placeText: { fontSize: 15, fontWeight: '800', color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 15 },
  save: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  standings: { marginHorizontal: 16, marginTop: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center' },
  standingsText: { color: colors.primary, fontWeight: '800' },
});
