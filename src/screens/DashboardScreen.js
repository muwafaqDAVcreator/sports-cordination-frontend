import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SduiRenderer from '../sdui/SduiRenderer';
import SyncStatusBar, { relativeTime } from '../components/SyncStatusBar';
import { runSync } from '../redux/actions';
import { buildLocalContext, DEFAULT_LAYOUT, isStale } from '../logic/sdui';
import { colors } from '../theme';

const REASON_TEXT = {
  normal: 'All events on track',
  delay_detected: 'Layout re-prioritised: schedule delay detected',
  bottleneck_detected: 'Layout re-prioritised: resource bottleneck detected',
  results_backlog: 'Layout re-prioritised: results awaiting entry',
  default: 'Default layout (not yet synced)',
};

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { events, athletes, results, delays, layout } = useSelector((s) => s.data);
  const { syncing, pendingCount, isOnline } = useSelector((s) => s.sync);

  const schema = layout || DEFAULT_LAYOUT;
  const context = useMemo(
    () => buildLocalContext({ events, athletes, results, delays, pendingCount }),
    [events, athletes, results, delays, pendingCount],
  );

  const onAction = (action) => {
    if (action.command === 'sync') {
      dispatch(runSync());
      return;
    }
    if (action.route) navigation.navigate(action.route, action.params);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const stale = layout && isStale(layout);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={syncing} onRefresh={() => dispatch(runSync())} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>{greeting}, {user?.name?.split(' ')[0] || 'Coordinator'}</Text>
        <Text style={styles.role}>{user?.role === 'admin' ? 'Administrator' : 'Event Coordinator'}</Text>
      </View>

      <SyncStatusBar />

      <View style={[styles.reason, schema.reason !== 'normal' && schema.reason !== 'default' && styles.reasonActive]}>
        <Text style={styles.reasonText}>
          🤖 {REASON_TEXT[schema.reason] || 'AI-optimised layout'}
        </Text>
        <Text style={styles.reasonMeta}>
          {layout
            ? `Generated ${relativeTime(layout.generated_at)}${!isOnline ? ' · cached offline' : stale ? ' · cached (stale)' : ''}`
            : 'Connect once to receive the AI-optimised layout'}
        </Text>
      </View>

      <SduiRenderer schema={schema} context={context} onAction={onAction} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  greeting: { fontSize: 21, fontWeight: '800', color: colors.text },
  role: { fontSize: 13, color: colors.muted, marginTop: 2 },
  reason: { marginHorizontal: 16, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primaryLight },
  reasonActive: { backgroundColor: '#FFF4D6' },
  reasonText: { fontSize: 13, fontWeight: '700', color: colors.text },
  reasonMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
