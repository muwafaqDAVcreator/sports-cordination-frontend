import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents } from '../redux/dashboardSlice';

function EventItem({ event, navigation }) {
  return (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => navigation.navigate('AthleteList', { eventId: event.id, eventName: event.name })}
    >
      <View>
        <Text style={styles.eventName}>{event.name}</Text>
        <Text style={styles.eventDate}>
          {new Date(event.event_date).toLocaleDateString()} at {event.start_time}
        </Text>
        <Text style={styles.eventAthletes}>{event.athletes?.length || 0} Athletes</Text>
      </View>
      <View style={[styles.badge, styles[`badge_${event.status}`]]}>
        <Text style={styles.badgeText}>{event.status.charAt(0).toUpperCase() + event.status.slice(1)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatusFilter({ status, label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.filterButton, active && styles.filterButtonActive]} onPress={onPress}>
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function EventListScreen({ navigation }) {
  const dispatch = useDispatch();
  const { events, loading } = useSelector((state) => state.dashboard);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    dispatch(fetchEvents());
  }, []);

  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((e) => e.status.toLowerCase() === filterStatus.toLowerCase());
    }
    if (searchText) {
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(searchText.toLowerCase()));
    }
    return [...filtered].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }, [events, searchText, filterStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events ({filteredEvents.length})</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterContainer}>
        <StatusFilter status="ALL" label="All" active={filterStatus === 'ALL'} onPress={() => setFilterStatus('ALL')} />
        <StatusFilter status="UPCOMING" label="Upcoming" active={filterStatus === 'UPCOMING'} onPress={() => setFilterStatus('UPCOMING')} />
        <StatusFilter status="RUNNING" label="Running" active={filterStatus === 'RUNNING'} onPress={() => setFilterStatus('RUNNING')} />
        <StatusFilter status="COMPLETED" label="Completed" active={filterStatus === 'COMPLETED'} onPress={() => setFilterStatus('COMPLETED')} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1F4788" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={({ item }) => <EventItem event={item} navigation={navigation} />}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchEvents())} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No events found</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  searchContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', gap: 8 },
  filterButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  filterButtonActive: { backgroundColor: '#1F4788', borderColor: '#1F4788' },
  filterButtonText: { fontSize: 12, color: '#666', fontWeight: '600' },
  filterButtonTextActive: { color: '#fff' },
  eventItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginVertical: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 8 },
  eventName: { fontSize: 14, fontWeight: '600', color: '#333' },
  eventDate: { fontSize: 12, color: '#666', marginTop: 2 },
  eventAthletes: { fontSize: 11, color: '#999', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badge_upcoming: { backgroundColor: '#F0F0F0' },
  badge_running: { backgroundColor: '#E3F2FD' },
  badge_completed: { backgroundColor: '#E8F5E9' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#666' },
  emptyText: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 30 },
});
