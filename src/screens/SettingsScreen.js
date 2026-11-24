import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { runSync, setAutoSync, setSyncInterval } from '../redux/actions';
import { relativeTime } from '../components/SyncStatusBar';
import { colors } from '../theme';

const INTERVALS = [1, 5, 15, 30];

function Row({ label, value, children }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children || <Text style={styles.rowValue}>{value ?? '—'}</Text>}
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { isOnline, pendingCount, failedCount, syncing, lastSyncAt, lastResult, autoSync, intervalMinutes } = useSelector((s) => s.sync);

  const syncNow = async () => {
    const summary = await dispatch(runSync());
    if (!summary) return;
    if (summary.error) Alert.alert('Sync not completed', summary.error);
    else Alert.alert('Sync complete', `${summary.applied} change(s) uploaded${summary.conflicts ? `, ${summary.conflicts} conflict(s) resolved` : ''}${summary.rejected ? `, ${summary.rejected} rejected` : ''}.`);
  };

  const confirmLogout = () => {
    const warning = pendingCount > 0
      ? `You have ${pendingCount} unsynced change(s). Logging out will delete them from this device.`
      : 'Local data will be removed from this device.';
    Alert.alert('Log out', warning, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text></View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{user?.role === 'admin' ? 'Administrator' : 'Event Coordinator'}{user?.house ? ` · ${user.house} House` : ''}</Text>
      </View>

      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.section}>
        <Row label="Email" value={user?.email} />
        <Row label="Phone" value={user?.phone} />
      </View>

      <Text style={styles.sectionTitle}>Synchronisation</Text>
      <View style={styles.section}>
        <Row label="Connection" value={isOnline ? 'Online' : 'Offline'} />
        <Row label="Last sync" value={relativeTime(lastSyncAt)} />
        <Row label="Pending changes" value={pendingCount} />
        <Row label="Failed changes" value={failedCount} />
        {lastResult?.error ? <Text style={styles.lastError}>Last attempt: {lastResult.error}</Text> : null}
        <Row label="Auto-sync">
          <Switch value={autoSync} onValueChange={(v) => dispatch(setAutoSync(v))} trackColor={{ true: colors.primary }} accessibilityLabel="Auto-sync" />
        </Row>
        {autoSync && (
          <View style={styles.intervalRow}>
            <Text style={styles.rowLabel}>Sync every</Text>
            <View style={styles.intervals}>
              {INTERVALS.map((m) => (
                <TouchableOpacity key={m} style={[styles.interval, intervalMinutes === m && styles.intervalActive]} onPress={() => dispatch(setSyncInterval(m))}>
                  <Text style={[styles.intervalText, intervalMinutes === m && { color: '#fff' }]}>{m}m</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primary} onPress={syncNow} disabled={syncing} accessibilityRole="button">
          {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>🔄 Sync Now</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SyncActivity')}>
          <Text style={styles.buttonText}>⚖️ Sync Activity & Conflicts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.buttonText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={styles.buttonText}>🔒 Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.dangerBg }]} onPress={confirmLogout}>
          <Text style={[styles.buttonText, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  profile: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  role: { fontSize: 13, color: colors.muted, marginTop: 3 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', marginHorizontal: 16, marginTop: 18, marginBottom: 6 },
  section: { backgroundColor: colors.card, marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F2F4' },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, color: colors.text, fontWeight: '700' },
  lastError: { fontSize: 12, color: colors.warning, paddingVertical: 8 },
  intervalRow: { paddingVertical: 11, gap: 8 },
  intervals: { flexDirection: 'row', gap: 8 },
  interval: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  intervalActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  intervalText: { fontWeight: '700', color: colors.text },
  actions: { padding: 16, gap: 10 },
  primary: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  button: { backgroundColor: colors.card, paddingVertical: 13, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  buttonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
