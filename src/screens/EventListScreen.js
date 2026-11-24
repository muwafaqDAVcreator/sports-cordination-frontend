import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectEvents } from '../redux/dataSlice';
import { runSync } from '../redux/actions';
import { colors, statusColors, statusLabel } from '../theme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'running', label: 'Running' },
  { key: 'completed', label: 'Completed' },
];

function EventItem({ event, athleteCount, delay, onPress }) {
  const st = statusColors[event.status] || statusColors.upcoming;
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${event.name}, ${statusLabel[event.status]}`}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{event.name}{event._pending ? '  ⏳' : ''}{event._syncError ? '  ⚠️' : ''}</Text>
        <Text style={styles.meta}>{event.event_date} · {event.start_time}{event.venue ? ` · ${event.venue}` : ''}</Text>
        <Text style={styles.sub}>{athleteCount} athletes{delay > 0 && event.status !== 'completed' ? ` · delayed ${delay} min` : ''}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: st.bg }]}>
        <Text style={[styles.badgeText, { color: st.fg }]}>{statusLabel[event.status] || event.status}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function EventListScreen({ navigation }) {
  const dispatch = useDispatch();
  const events = useSelector(selectEvents);
  const { athletes, delays } = useSelector((s) => s.data);
  const { syncing } = useSelector((s) => s.sync);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => {
    const a = {};
    for (const x of athletes) a[x.event_uuid] = (a[x.event_uuid] || 0) + 1;
    const d = {};
    for (const x of delays) d[x.event_uuid] = (d[x.event_uuid] || 0) + x.delay_minutes;
    return { a, d };
  }, [athletes, delays]);

  const filtered = useMemo(() => events.filter((e) =>
    (filter === 'all' || e.status === filter)
    && (!search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.venue || '').toLowerCase().includes(search.toLowerCase()))),
  [events, search, filter]);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TextInput style={styles.search} placeholder="Search events or venues..." value={search} onChangeText={setSearch} accessibilityLabel="Search events" />
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.key} style={[styles.chip, filter === f.key && styles.chipActive]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.uuid}
        contentContainerStyle={{ paddingBottom: 90 }}
        renderItem={({ item }) => (
          <EventItem
            event={item}
            athleteCount={counts.a[item.uuid] || 0}
            delay={counts.d[item.uuid] || 0}
            onPress={() => navigation.navigate('EventDetail', { eventUuid: item.uuid })}
          />
        )}
        refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => dispatch(runSync())} />}
        ListEmptyComponent={<Text style={styles.empty}>{events.length ? 'No events match your filter' : 'No events yet. Create your first event.'}</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEvent')} accessibilityRole="button" accessibilityLabel="Create new event">
        <Text style={styles.fabText}>＋ New Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolbar: { backgroundColor: colors.card, padding: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, paddingHorizontal: 30 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: colors.primary, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 28, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
