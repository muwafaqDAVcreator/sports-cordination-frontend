import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { selectEvent } from '../redux/dataSlice';
import { eventStandings } from '../logic/standings';
import { colors } from '../theme';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** Computed on the device from local results, so it is correct offline (FR3). */
export default function StandingsScreen({ route }) {
  const { eventUuid } = route.params;
  const event = useSelector(selectEvent(eventUuid));
  const { results, athletes } = useSelector((s) => s.data);
  const { rankings, medalTable } = useMemo(() => eventStandings(eventUuid, results, athletes), [eventUuid, results, athletes]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.header}>
        <Text style={styles.title}>{event?.name}</Text>
        <Text style={styles.sub}>Scoring: 1st 5 pts · 2nd 3 pts · 3rd 1 pt</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>House medal table</Text>
        {medalTable.length === 0 ? <Text style={styles.empty}>No placings recorded yet</Text> : (
          <>
            <View style={styles.row}>
              <Text style={[styles.house, styles.head]}>House</Text>
              {['🥇', '🥈', '🥉', 'Pts'].map((h) => <Text key={h} style={[styles.cell, styles.head]}>{h}</Text>)}
            </View>
            {medalTable.map((r) => (
              <View key={r.house} style={styles.row}>
                <Text style={styles.house}>{r.house}</Text>
                <Text style={styles.cell}>{r.gold}</Text>
                <Text style={styles.cell}>{r.silver}</Text>
                <Text style={styles.cell}>{r.bronze}</Text>
                <Text style={[styles.cell, styles.points]}>{r.points}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rankings</Text>
        {rankings.length === 0 ? <Text style={styles.empty}>No results entered yet</Text> : rankings.map((r) => (
          <View key={r.uuid} style={styles.rank}>
            <Text style={styles.medal}>{MEDAL[r.placement] || `#${r.placement}`}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.athlete?.name || 'Unknown athlete'}{r._pending ? '  ⏳' : ''}</Text>
              <Text style={styles.meta}>{r.athlete?.house || '—'}{r.athlete?.bib_number ? ` · Bib #${r.athlete.bib_number}` : ''}</Text>
            </View>
            <Text style={styles.time}>{r.time || ''}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.card, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 17, fontWeight: '800', color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.card, margin: 16, marginBottom: 0, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  empty: { color: colors.muted, paddingVertical: 8 },
  row: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F2F4' },
  head: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  house: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  cell: { width: 42, textAlign: 'center', fontSize: 14, color: colors.text },
  points: { fontWeight: '800', color: colors.primary },
  rank: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#F1F2F4', gap: 8 },
  medal: { width: 40, fontSize: 20, textAlign: 'center', fontWeight: '800', color: colors.muted },
  name: { fontSize: 14, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  time: { fontSize: 13, fontWeight: '700', color: colors.text },
});
