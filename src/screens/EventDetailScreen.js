import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectEvent, selectAthletesFor, selectResultsFor, selectDelaysFor, totalDelay } from '../redux/dataSlice';
import { setEventStatus, logDelay, deleteEvent } from '../redux/actions';
import { colors, severityColors, statusColors, statusLabel } from '../theme';

const QUICK_DELAYS = [5, 10, 15, 30];

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );
}

export default function EventDetailScreen({ route, navigation }) {
  const { eventUuid } = route.params;
  const dispatch = useDispatch();
  const event = useSelector(selectEvent(eventUuid));
  const athletes = useSelector(selectAthletesFor(eventUuid));
  const results = useSelector(selectResultsFor(eventUuid));
  const delays = useSelector(selectDelaysFor(eventUuid));
  const [minutes, setMinutes] = useState('');
  const [reason, setReason] = useState('');

  useLayoutEffect(() => {
    if (event) navigation.setOptions({ title: event.name });
  }, [event?.name]);

  if (!event) {
    return <Text style={styles.missing}>This event is no longer available.</Text>;
  }

  const st = statusColors[event.status] || statusColors.upcoming;
  const delay = totalDelay(delays);
  const short = (event.officials_required || 0) - (event.officials_assigned || 0);

  const changeStatus = (status) => dispatch(setEventStatus(event, status));

  const submitDelay = async (value) => {
    try {
      await dispatch(logDelay(event, parseInt(value, 10), reason));
      setMinutes('');
      setReason('');
    } catch (err) {
      Alert.alert('Cannot log delay', err.message);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete event', `Delete ${event.name} with its athletes and results?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await dispatch(deleteEvent(event)); navigation.goBack(); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.headerCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.fg }]}>{statusLabel[event.status]}</Text>
          </View>
          {event._pending ? <Text style={styles.pending}>⏳ Pending sync</Text> : null}
          {event._syncError ? <Text style={styles.syncError}>⚠️ {event._syncError}</Text> : null}
        </View>
        <InfoRow label="Discipline" value={event.discipline} />
        <InfoRow label="Date" value={event.event_date} />
        <InfoRow label="Scheduled" value={`${event.start_time}${event.end_time ? ` – ${event.end_time}` : ''}`} />
        {event.actual_start_time ? <InfoRow label="Actual start" value={event.actual_start_time} /> : null}
        <InfoRow label="Venue" value={event.venue} />
        <InfoRow label="Officials" value={`${event.officials_assigned || 0} / ${event.officials_required || 0}${short > 0 ? `  (${short} short)` : ''}`} />
        <InfoRow label="Athletes / results" value={`${athletes.length} / ${results.length}`} />
      </View>

      <View style={styles.statusRow}>
        {event.status === 'upcoming' && (
          <TouchableOpacity style={[styles.statusBtn, { backgroundColor: colors.primary }]} onPress={() => changeStatus('running')}>
            <Text style={styles.statusBtnText}>▶ Start Event</Text>
          </TouchableOpacity>
        )}
        {event.status === 'running' && (
          <TouchableOpacity style={[styles.statusBtn, { backgroundColor: colors.success }]} onPress={() => changeStatus('completed')}>
            <Text style={styles.statusBtnText}>✓ Mark Completed</Text>
          </TouchableOpacity>
        )}
        {event.status === 'completed' && (
          <TouchableOpacity style={[styles.statusBtn, styles.outlineBtn]} onPress={() => changeStatus('running')}>
            <Text style={[styles.statusBtnText, { color: colors.primary }]}>↺ Reopen</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('AthleteList', { eventUuid })}>
          <Text style={styles.navIcon}>👟</Text><Text style={styles.navText}>Athletes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('ResultsEntry', { eventUuid })}>
          <Text style={styles.navIcon}>⏱️</Text><Text style={styles.navText}>Enter Results</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('Standings', { eventUuid })}>
          <Text style={styles.navIcon}>🏆</Text><Text style={styles.navText}>Standings</Text>
        </TouchableOpacity>
      </View>

      {event.status !== 'completed' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log schedule delay</Text>
          <Text style={styles.cardHint}>Delays feed the analytics engine, which re-prioritises every coordinator's dashboard.</Text>
          <View style={styles.quickRow}>
            {QUICK_DELAYS.map((m) => (
              <TouchableOpacity key={m} style={styles.quick} onPress={() => submitDelay(m)} accessibilityLabel={`Log ${m} minute delay`}>
                <Text style={styles.quickText}>+{m} min</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.delayForm}>
            <TextInput style={[styles.input, { width: 80 }]} placeholder="min" keyboardType="numeric" value={minutes} onChangeText={setMinutes} accessibilityLabel="Delay minutes" />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Reason (optional)" value={reason} onChangeText={setReason} accessibilityLabel="Delay reason" />
            <TouchableOpacity style={styles.logBtn} onPress={() => submitDelay(minutes)}>
              <Text style={styles.logBtnText}>Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {delays.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delay history · total {delay} min</Text>
          {delays.map((d) => {
            const sev = severityColors[d.severity] || severityColors.minor;
            return (
              <View key={d.uuid} style={styles.delayRow}>
                <View style={[styles.sev, { backgroundColor: sev.bg }]}><Text style={[styles.sevText, { color: sev.fg }]}>{d.severity}</Text></View>
                <Text style={styles.delayText}>+{d.delay_minutes} min{d.reason ? ` · ${d.reason}` : ''}{d._pending ? '  ⏳' : ''}</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity style={[styles.footerBtn, styles.outlineBtn]} onPress={() => navigation.navigate('EditEvent', { eventUuid })}>
          <Text style={[styles.footerBtnText, { color: colors.primary }]}>Edit Event</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.footerBtn, { backgroundColor: colors.dangerBg }]} onPress={confirmDelete}>
          <Text style={[styles.footerBtnText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  missing: { textAlign: 'center', color: colors.muted, marginTop: 40 },
  headerCard: { backgroundColor: colors.card, margin: 16, marginBottom: 0, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  pending: { fontSize: 12, color: colors.warning, fontWeight: '700', marginBottom: 6 },
  syncError: { fontSize: 12, color: colors.danger, fontWeight: '700', marginBottom: 6, flexShrink: 1 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#F1F2F4' },
  infoLabel: { color: colors.muted, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  statusRow: { marginHorizontal: 16, marginTop: 12 },
  statusBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  statusBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  outlineBtn: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.card },
  nav: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 12 },
  navBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  navIcon: { fontSize: 22 },
  navText: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: 4 },
  card: { backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  cardHint: { fontSize: 12, color: colors.muted, marginTop: 3, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quick: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#FFF4D6', alignItems: 'center' },
  quickText: { fontWeight: '800', color: '#7A4A00' },
  delayForm: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, backgroundColor: '#fff' },
  logBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 8 },
  logBtnText: { color: '#fff', fontWeight: '800' },
  delayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderTopWidth: 1, borderTopColor: '#F1F2F4' },
  sev: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, minWidth: 62, alignItems: 'center' },
  sevText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  delayText: { fontSize: 13, color: colors.text, flex: 1 },
  footerRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16 },
  footerBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  footerBtnText: { fontWeight: '800', fontSize: 14 },
});
