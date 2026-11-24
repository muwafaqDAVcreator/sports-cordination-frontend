import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { runSync } from '../redux/actions';
import { colors } from '../theme';

export const relativeTime = (iso) => {
  if (!iso) return 'never';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString();
};

/** Always-visible connectivity and sync indicator (interim design, Section 3.3). */
export default function SyncStatusBar() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { isOnline, syncing, pendingCount, failedCount, lastSyncAt, lastResult } = useSelector((s) => s.sync);

  const dot = !isOnline ? colors.muted : lastResult?.error ? colors.warning : colors.success;
  const title = !isOnline ? 'Offline - working locally' : lastResult?.error && pendingCount ? 'Online - server unreachable' : 'Online';

  return (
    <TouchableOpacity
      style={styles.bar}
      onPress={() => navigation.navigate('SyncActivity')}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${pendingCount} changes pending. Open sync activity`}
    >
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Last sync {relativeTime(lastSyncAt)}</Text>
      </View>
      {failedCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.dangerBg }]}>
          <Text style={[styles.badgeText, { color: colors.danger }]}>{failedCount} failed</Text>
        </View>
      )}
      {pendingCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.warningBg }]}>
          <Text style={[styles.badgeText, { color: colors.warning }]}>{pendingCount} pending</Text>
        </View>
      )}
      {syncing ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
      ) : (
        isOnline && (
          <TouchableOpacity onPress={() => dispatch(runSync())} style={styles.syncBtn} accessibilityLabel="Sync now">
            <Text style={styles.syncBtnText}>Sync</Text>
          </TouchableOpacity>
        )
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  syncBtn: { marginLeft: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: colors.primaryLight },
  syncBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
