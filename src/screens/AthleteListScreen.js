import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectAthletesFor, selectResultsFor, selectEvent } from '../redux/dataSlice';
import { deleteAthlete } from '../redux/actions';
import { colors } from '../theme';

const HOUSE_COLORS = { Red: '#D64545', Blue: '#2F6FD6', Green: '#2E9E5B', Yellow: '#D4A017' };

export default function AthleteListScreen({ route, navigation }) {
  const { eventUuid } = route.params;
  const dispatch = useDispatch();
  const event = useSelector(selectEvent(eventUuid));
  const athletes = useSelector(selectAthletesFor(eventUuid));
  const results = useSelector(selectResultsFor(eventUuid));
  const [search, setSearch] = useState('');
  const [house, setHouse] = useState('all');

  const houses = useMemo(() => [...new Set(athletes.map((a) => a.house).filter(Boolean))].sort(), [athletes]);
  const withResult = useMemo(() => new Set(results.map((r) => r.athlete_uuid)), [results]);

  const filtered = athletes.filter((a) =>
    (house === 'all' || a.house === house)
    && (!search || a.name.toLowerCase().includes(search.toLowerCase()) || String(a.bib_number || '').includes(search)));

  const confirmDelete = (athlete) => {
    Alert.alert('Remove athlete', `Remove ${athlete.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: () => dispatch(deleteAthlete(athlete)).catch((err) => Alert.alert('Cannot remove', err.message)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>{event?.name} · {athletes.length} athletes</Text>
        <TextInput style={styles.search} placeholder="Search by name or bib..." value={search} onChangeText={setSearch} accessibilityLabel="Search athletes" />
        {houses.length > 0 && (
          <View style={styles.filters}>
            {['all', ...houses].map((h) => (
              <TouchableOpacity key={h} style={[styles.chip, house === h && styles.chipActive]} onPress={() => setHouse(h)}>
                <Text style={[styles.chipText, house === h && styles.chipTextActive]}>{h === 'all' ? 'All' : h}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.uuid}
        contentContainerStyle={{ paddingBottom: 90 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.bib, { backgroundColor: HOUSE_COLORS[item.house] || colors.primary }]}>
              <Text style={styles.bibText}>{item.bib_number ?? '–'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}{item._pending ? '  ⏳' : ''}{item._syncError ? '  ⚠️' : ''}</Text>
              <Text style={styles.meta}>{item.house || 'No house'}{item.age ? ` · Age ${item.age}` : ''}{withResult.has(item.uuid) ? ' · ✓ result' : ''}</Text>
              {item._syncError ? <Text style={styles.err}>{item._syncError}</Text> : null}
            </View>
            <TouchableOpacity style={styles.edit} onPress={() => navigation.navigate('EditAthlete', { eventUuid, athleteUuid: item.uuid })}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.del} onPress={() => confirmDelete(item)} accessibilityLabel={`Remove ${item.name}`}>
              <Text style={styles.delText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No athletes registered yet</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddAthlete', { eventUuid })} accessibilityRole="button">
        <Text style={styles.fabText}>＋ Add Athlete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar: { backgroundColor: colors.card, padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  bib: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bibText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  err: { fontSize: 11, color: colors.danger, marginTop: 2 },
  edit: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, backgroundColor: colors.primaryLight },
  editText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  del: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, backgroundColor: colors.dangerBg },
  delText: { color: colors.danger, fontWeight: '800', fontSize: 12 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 28, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
