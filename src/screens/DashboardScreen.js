import React, { useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../redux/dashboardSlice';

const formatTime = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const diffMinutes = Math.floor((new Date() - date) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return date.toLocaleDateString();
};

function EventCard({ event, navigation }) {
  return (
    <TouchableOpacity style={styles.eventCard} onPress={() => navigation.navigate('Events')}>
      <View style={styles.eventInfo}>
        <Text style={styles.eventName}>🏃 {event.name}</Text>
        <Text style={styles.eventDetails}>
          {new Date(event.event_date).toLocaleDateString()} | {event.start_time}
        </Text>
        <Text style={styles.eventAthletes}>{event.athletes?.length || 0} Athletes</Text>
      </View>
      <View style={[styles.statusBadge, styles[`status_${event.status}`]]}>
        <Text>
          {event.status === 'upcoming' && '○'}
          {event.status === 'running' && '●'}
          {event.status === 'completed' && '✓'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { todayEvents, stats, lastSyncTime, loading } = useSelector((state) => state.dashboard);
  const { isOnline, pendingCount } = useSelector((state) => state.sync);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => dispatch(fetchDashboard())} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user?.name}! 👋
        </Text>
        <Text style={styles.headerSubtitle}>Athletics Meet 2026</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusLabel}>{isOnline ? '● Online' : '● Offline'}</Text>
          <Text style={styles.lastSyncText}>Last sync: {formatTime(lastSyncTime)}</Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
          </View>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Quick Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard label="Events" value={stats.total_events} />
          <StatCard label="Athletes" value={stats.total_athletes} />
          <StatCard label="Results" value={stats.results_entered} />
          <StatCard label="Pending" value={stats.pending_changes} />
        </View>
      </View>

      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>📅 Today's Events</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#1F4788" style={{ marginVertical: 20 }} />
        ) : todayEvents.length > 0 ? (
          todayEvents.map((event) => <EventCard key={event.id} event={event} navigation={navigation} />)
        ) : (
          <Text style={styles.noEventsText}>No events today</Text>
        )}
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={() => navigation.navigate('Events')}>
          <Text style={styles.primaryButtonText}>📋 View All Events</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#666' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginVertical: 15, padding: 12, backgroundColor: '#fff', borderRadius: 8 },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  online: { backgroundColor: '#27AE60' },
  offline: { backgroundColor: '#95A5A6' },
  statusLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  lastSyncText: { fontSize: 12, color: '#999', marginTop: 2 },
  pendingBadge: { backgroundColor: '#FFF3CD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#8A6D00' },
  statsSection: { paddingHorizontal: 20, paddingVertical: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', padding: 15, borderRadius: 8, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1F4788' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  eventsSection: { paddingHorizontal: 20, paddingVertical: 15 },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10 },
  eventInfo: { flex: 1 },
  eventName: { fontSize: 14, fontWeight: '600', color: '#333' },
  eventDetails: { fontSize: 12, color: '#666', marginTop: 2 },
  eventAthletes: { fontSize: 12, color: '#999', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  status_upcoming: { backgroundColor: '#F0F0F0' },
  status_running: { backgroundColor: '#E8F4F8' },
  status_completed: { backgroundColor: '#E8F5E9' },
  noEventsText: { fontSize: 14, color: '#999', textAlign: 'center', paddingVertical: 20 },
  actionsSection: { paddingHorizontal: 20, paddingVertical: 20, gap: 10 },
  actionButton: { padding: 14, borderRadius: 8, alignItems: 'center' },
  primaryButton: { backgroundColor: '#1F4788' },
  primaryButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
