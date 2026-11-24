import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { discardMutation, retryMutation, runSync } from '../redux/actions';
import api from '../services/api';
import { relativeTime } from '../components/SyncStatusBar';
import { colors } from '../theme';

const OP_LABEL = { create: 'Create', update: 'Update', delete: 'Delete' };
const describe = (m) => m.data?.name || (m.data?.delay_minutes ? `${m.data.delay_minutes} min delay` : null)
  || (m.data?.placement ? `placement ${m.data.placement}` : null)
  || (m.data && Object.keys(m.data).length ? Object.entries(m.data).map(([k, v]) => `${k} → ${v}`).join(', ') : null)
  || m.uuid.slice(0, 8);

/** Transparency over the offline machinery: queue, failures and conflict audit (FR6, FR10). */
export default function SyncActivityScreen() {
  const dispatch = useDispatch();
  const { queue, conflictLog, isOnline } = useSelector((s) => s.sync);
  const [serverLog, setServerLog] = useState(null);

  useEffect(() => {
    if (!isOnline) return;
    api.get('/sync/conflicts').then((res) => setServerLog(res.data.data)).catch(() => setServerLog(null));
  }, [isOnline, conflictLog.length]);

  const pending = queue.filter((m) => m.status === 'pending');
  const failed = queue.filter((m) => m.status === 'failed');

  const discard = (m) => Alert.alert('Discard change', 'This change will be dropped and the server version restored.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: () => dispatch(discardMutation(m.id)) },
  ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.card}>
        <Text style={styles.title}>Sync queue</Text>
        <Text style={styles.hint}>Every change is saved on this device first, then uploaded in order. Nothing is lost while offline.</Text>
        {pending.length === 0 && failed.length === 0 && <Text style={styles.ok}>✓ Everything is synced</Text>}
        {pending.map((m) => (
          <View key={m.id} style={styles.item}>
            <Text style={styles.itemTitle}>⏳ {OP_LABEL[m.op]} {m.entity} · {describe(m)}</Text>
            <Text style={styles.itemMeta}>Queued {relativeTime(m.client_updated_at)}{m.attempts ? ` · ${m.attempts} attempt(s)` : ''}</Text>
          </View>
        ))}
        {pending.length > 0 && isOnline && (
          <TouchableOpacity style={styles.btn} onPress={() => dispatch(runSync())}><Text style={styles.btnText}>Upload now</Text></TouchableOpacity>
        )}
      </View>

      {failed.length > 0 && (
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.danger }]}>Rejected by server ({failed.length})</Text>
          <Text style={styles.hint}>The server validated these changes against the same rules as online entry and refused them. Fix the data and retry, or discard.</Text>
          {failed.map((m) => (
            <View key={m.id} style={styles.item}>
              <Text style={styles.itemTitle}>⚠️ {OP_LABEL[m.op]} {m.entity} · {describe(m)}</Text>
              <Text style={styles.error}>{m.error}</Text>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => dispatch(retryMutation(m.id))}><Text style={styles.link}>Retry</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => discard(m)}><Text style={[styles.link, { color: colors.danger }]}>Discard</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>Conflicts resolved on this device</Text>
        <Text style={styles.hint}>Conflicts are resolved by last-write-wins: the most recent edit is kept and the decision is logged.</Text>
        {conflictLog.length === 0 ? <Text style={styles.muted}>No conflicts</Text> : conflictLog.map((c) => (
          <View key={c.id} style={styles.item}>
            <Text style={styles.itemTitle}>{c.resolution === 'server_wins' ? '↩️ Server version kept' : '✅ Your version kept'} · {c.entity} {c.label}</Text>
            <Text style={styles.itemMeta}>{relativeTime(c.at)} · your change: {Object.entries(c.local_change || {}).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Server audit log</Text>
        {!isOnline ? <Text style={styles.muted}>Available when online</Text>
          : !serverLog ? <Text style={styles.muted}>Loading…</Text>
          : serverLog.length === 0 ? <Text style={styles.muted}>No conflicts recorded</Text>
          : serverLog.map((c) => (
            <View key={c.id} style={styles.item}>
              <Text style={styles.itemTitle}>{c.entity} · {c.resolution.replace('_', ' ')} ({c.rule.toUpperCase()})</Text>
              <Text style={styles.itemMeta}>{relativeTime(c.created_at)} · client: {JSON.stringify(c.client_payload)}</Text>
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: { backgroundColor: colors.card, margin: 16, marginBottom: 0, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  hint: { fontSize: 12, color: colors.muted, marginTop: 3, marginBottom: 8, lineHeight: 17 },
  ok: { color: colors.success, fontWeight: '700', paddingVertical: 6 },
  muted: { color: colors.muted, paddingVertical: 6 },
  item: { paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#F1F2F4' },
  itemTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  error: { fontSize: 12, color: colors.danger, marginTop: 2 },
  itemActions: { flexDirection: 'row', gap: 18, marginTop: 6 },
  link: { color: colors.primary, fontWeight: '700' },
  btn: { marginTop: 8, backgroundColor: colors.primary, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
});
