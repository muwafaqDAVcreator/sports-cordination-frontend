import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAthletes } from '../redux/athletesSlice';
import { fetchResults, saveResult } from '../redux/resultsSlice';

const PLACEMENTS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ResultsEntryScreen({ route, navigation }) {
  const { eventId, eventName } = route.params;
  const dispatch = useDispatch();
  const { athletes } = useSelector((state) => state.athletes);
  const { results, loading } = useSelector((state) => state.results);

  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [placement, setPlacement] = useState(null);
  const [time, setTime] = useState('');
  const [windSpeed, setWindSpeed] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAthletes(eventId));
    dispatch(fetchResults(eventId));
  }, [eventId]);

  const usedPlacements = results.filter((r) => r.placement && r.athlete_id !== selectedAthlete?.id).map((r) => r.placement);

  const resultForAthlete = (athleteId) => results.find((r) => r.athlete_id === athleteId);

  const selectAthlete = (athlete) => {
    setSelectedAthlete(athlete);
    const existing = resultForAthlete(athlete.id);
    setPlacement(existing?.placement || null);
    setTime(existing?.time || '');
    setWindSpeed(existing?.wind_speed?.toString() || '');
  };

  const handleSave = async () => {
    if (!selectedAthlete) {
      Alert.alert('Error', 'Select an athlete first');
      return;
    }
    setSaving(true);
    try {
      await dispatch(saveResult({
        eventId,
        data: {
          athlete_id: selectedAthlete.id,
          placement,
          time: time || null,
          wind_speed: windSpeed ? parseFloat(windSpeed) : null,
        },
      })).unwrap();
      Alert.alert('Saved', `Result saved for ${selectedAthlete.name}`);
      setSelectedAthlete(null);
      setPlacement(null);
      setTime('');
      setWindSpeed('');
    } catch (err) {
      Alert.alert('Error', err || 'Failed to save result');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{eventName}</Text>
        <Text style={styles.subtitle}>Enter Results ({results.length}/{athletes.length} done)</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Athlete</Text>
        <FlatList
          data={athletes}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const done = !!resultForAthlete(item.id);
            const active = selectedAthlete?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.athleteChip, active && styles.athleteChipActive, done && styles.athleteChipDone]}
                onPress={() => selectAthlete(item)}
              >
                <Text style={[styles.athleteChipText, active && styles.athleteChipTextActive]}>
                  {done ? '✓ ' : ''}{item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {selectedAthlete && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>{selectedAthlete.name}</Text>

          <Text style={styles.label}>Placement</Text>
          <View style={styles.placementRow}>
            {PLACEMENTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.placementChip, placement === p && styles.placementChipActive, usedPlacements.includes(p) && styles.placementChipDisabled]}
                onPress={() => !usedPlacements.includes(p) && setPlacement(p)}
                disabled={usedPlacements.includes(p)}
              >
                <Text style={[styles.placementChipText, placement === p && styles.placementChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Time (MM:SS.ms)</Text>
          <TextInput style={styles.input} placeholder="00:11.20" value={time} onChangeText={setTime} />

          <Text style={styles.label}>Wind Speed (m/s)</Text>
          <TextInput style={styles.input} placeholder="1.2" value={windSpeed} onChangeText={setWindSpeed} keyboardType="numbers-and-punctuation" />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save & Next</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.standingsButton} onPress={() => navigation.navigate('Standings', { eventId, eventName })}>
        <Text style={styles.standingsButtonText}>🏆 View Standings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  athleteChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff', marginRight: 8 },
  athleteChipActive: { backgroundColor: '#1F4788', borderColor: '#1F4788' },
  athleteChipDone: { borderColor: '#27AE60' },
  athleteChipText: { fontSize: 13, color: '#333', fontWeight: '600' },
  athleteChipTextActive: { color: '#fff' },
  form: { margin: 20, padding: 16, backgroundColor: '#fff', borderRadius: 8, gap: 10 },
  formTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F4788', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6472' },
  placementRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  placementChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  placementChipActive: { backgroundColor: '#1F4788', borderColor: '#1F4788' },
  placementChipDisabled: { opacity: 0.3 },
  placementChipText: { fontSize: 14, fontWeight: '700', color: '#333' },
  placementChipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  saveButton: { backgroundColor: '#1F4788', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  standingsButton: { marginHorizontal: 20, marginBottom: 20, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#1F4788', alignItems: 'center' },
  standingsButtonText: { color: '#1F4788', fontSize: 14, fontWeight: '700' },
});
