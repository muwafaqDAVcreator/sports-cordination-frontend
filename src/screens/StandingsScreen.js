import React, { useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStandings } from '../redux/resultsSlice';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function RankingItem({ item }) {
  return (
    <View style={styles.rankItem}>
      <Text style={styles.medal}>{MEDALS[item.placement] || `#${item.placement}`}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.athleteName}>{item.athlete.name}</Text>
        <Text style={styles.athleteHouse}>{item.athlete.house || '—'}</Text>
      </View>
      <Text style={styles.time}>{item.time || ''}</Text>
    </View>
  );
}

export default function StandingsScreen({ route }) {
  const { eventId, eventName } = route.params;
  const dispatch = useDispatch();
  const { rankings, housePoints, loading } = useSelector((state) => state.results);

  useEffect(() => {
    dispatch(fetchStandings(eventId));
  }, [eventId]);

  const houseEntries = Object.entries(housePoints);

  if (loading) {
    return <ActivityIndicator size="large" color="#1F4788" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{eventName}</Text>
        <Text style={styles.subtitle}>Standings</Text>
      </View>

      {houseEntries.length > 0 && (
        <View style={styles.housePointsSection}>
          <Text style={styles.sectionTitle}>🏠 House Points</Text>
          {houseEntries.map(([house, points]) => (
            <View key={house} style={styles.houseRow}>
              <Text style={styles.houseName}>{house}</Text>
              <Text style={styles.housePointsValue}>{points} pts</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.rankingsSection}>
        <Text style={styles.sectionTitle}>🏃 Rankings</Text>
        <FlatList
          data={rankings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RankingItem item={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No results entered yet</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10 },
  housePointsSection: { padding: 20, backgroundColor: '#fff', marginBottom: 8 },
  houseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  houseName: { fontSize: 14, fontWeight: '600', color: '#333' },
  housePointsValue: { fontSize: 14, fontWeight: '700', color: '#1F4788' },
  rankingsSection: { flex: 1, padding: 20 },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  medal: { fontSize: 20, width: 40, textAlign: 'center' },
  athleteName: { fontSize: 14, fontWeight: '600', color: '#333' },
  athleteHouse: { fontSize: 12, color: '#999', marginTop: 2 },
  time: { fontSize: 13, color: '#666', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 30 },
});
