// SDUI component registry: maps schema `type` values to native components.
// The server may only emit types listed here (enforced by its own registry
// and tested on both sides); anything else is skipped by the renderer.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, severityColors, statusColors, statusLabel } from '../theme';

function Card({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function AlertCard({ props, onAction }) {
  const sev = severityColors[props.severity] || severityColors.info;
  return (
    <View style={[styles.alert, { backgroundColor: sev.soft, borderLeftColor: sev.bg }]} accessibilityRole="alert">
      <View style={[styles.sevPill, { backgroundColor: sev.bg }]}>
        <Text style={[styles.sevPillText, { color: sev.fg }]}>{String(props.severity || 'info').toUpperCase()}</Text>
      </View>
      <Text style={styles.alertTitle}>{props.title}</Text>
      <Text style={styles.alertText}>{props.text}</Text>
      {props.action ? (
        <TouchableOpacity onPress={() => onAction(props.action)} style={styles.alertAction}>
          <Text style={styles.alertActionText}>{props.action.label} ›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function InsightList({ props, value, onAction }) {
  const findings = Array.isArray(value) ? value : [];
  return (
    <Card title={`🧠 ${props.title || 'Insights'}`}>
      {findings.length === 0 ? (
        <Text style={styles.empty}>{props.empty_text || 'No issues detected.'}</Text>
      ) : findings.map((f, i) => {
        const sev = severityColors[f.severity] || severityColors.info;
        return (
          <TouchableOpacity
            key={`${f.type}-${f.event_uuid}-${i}`}
            style={styles.insightRow}
            onPress={() => onAction({ route: 'EventDetail', params: { eventUuid: f.event_uuid } })}
          >
            <View style={[styles.insightDot, { backgroundColor: sev.bg }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>{f.title}</Text>
              <Text style={styles.insightText}>{f.message}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </Card>
  );
}

function ScheduleList({ props, value, onAction }) {
  const events = Array.isArray(value) ? value : [];
  return (
    <Card title={`📅 ${props.title || "Today's Events"}`}>
      {events.length === 0 ? <Text style={styles.empty}>No events scheduled today</Text> : events.map((e) => {
        const delayed = e.delay_minutes > 0 && e.status !== 'completed';
        const highlight = props.highlight === 'delayed' && delayed;
        const st = statusColors[e.status] || statusColors.upcoming;
        return (
          <TouchableOpacity
            key={e.uuid}
            style={[styles.scheduleRow, highlight && styles.scheduleRowHighlight]}
            onPress={() => onAction({ route: 'EventDetail', params: { eventUuid: e.uuid } })}
          >
            <Text style={styles.scheduleTime}>{e.start_time}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleName}>{e.name}{e.pending ? '  ⏳' : ''}</Text>
              <Text style={styles.scheduleVenue}>{e.venue || 'No venue'}{delayed ? ` · +${e.delay_minutes} min` : ''}</Text>
            </View>
            <View style={[styles.statusChip, { backgroundColor: delayed ? severityColors.major.soft : st.bg }]}>
              <Text style={[styles.statusChipText, { color: delayed ? severityColors.major.fg : st.fg }]}>
                {delayed ? 'Delayed' : statusLabel[e.status] || e.status}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </Card>
  );
}

function StatsRow({ props, value }) {
  const stats = value || {};
  return (
    <View style={styles.statsGrid}>
      {(props.items || []).map((item) => (
        <View key={item.key} style={styles.statCard}>
          <Text style={[styles.statValue, item.key === 'sync.pending' && stats[item.key] > 0 && { color: colors.warning }]}>
            {stats[item.key] ?? '–'}
          </Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function StandingsCard({ props, value }) {
  const rows = (Array.isArray(value) ? value : []).slice(0, props.limit || 4);
  return (
    <Card title={`🏆 ${props.title || 'Standings'}`}>
      {rows.length === 0 ? <Text style={styles.empty}>No results entered yet</Text> : (
        <>
          <View style={styles.medalHeader}>
            <Text style={[styles.medalHouse, styles.medalHeadText]}>House</Text>
            <Text style={[styles.medalCell, styles.medalHeadText]}>🥇</Text>
            <Text style={[styles.medalCell, styles.medalHeadText]}>🥈</Text>
            <Text style={[styles.medalCell, styles.medalHeadText]}>🥉</Text>
            <Text style={[styles.medalCell, styles.medalHeadText]}>Pts</Text>
          </View>
          {rows.map((r, i) => (
            <View key={r.house} style={styles.medalRow}>
              <Text style={styles.medalHouse}>{i + 1}. {r.house}</Text>
              <Text style={styles.medalCell}>{r.gold}</Text>
              <Text style={styles.medalCell}>{r.silver}</Text>
              <Text style={styles.medalCell}>{r.bronze}</Text>
              <Text style={[styles.medalCell, { fontWeight: '800', color: colors.primary }]}>{r.points}</Text>
            </View>
          ))}
        </>
      )}
    </Card>
  );
}

function ConflictSummary({ props, value, onAction }) {
  const v = value || {};
  return (
    <Card title={`⚖️ ${props.title || 'Sync conflicts'}`}>
      <Text style={styles.conflictLine}>{v.count || 0} conflict(s) resolved automatically, {v.server_wins || 0} kept the server version.</Text>
      <TouchableOpacity onPress={() => onAction({ route: 'SyncActivity' })}>
        <Text style={styles.link}>Review audit log ›</Text>
      </TouchableOpacity>
    </Card>
  );
}

const ACTIONS = {
  new_event: { label: '＋ New Event', route: 'AddEvent' },
  view_events: { label: '📋 All Events', route: 'Events' },
  sync_now: { label: '🔄 Sync Now', command: 'sync' },
  view_sync_activity: { label: '⚖️ Sync Activity', route: 'SyncActivity' },
};

function ActionRow({ props, onAction }) {
  return (
    <View style={styles.actionRow}>
      {(props.actions || []).filter((a) => ACTIONS[a]).map((a) => (
        <TouchableOpacity key={a} style={styles.actionBtn} onPress={() => onAction(ACTIONS[a])}>
          <Text style={styles.actionBtnText}>{ACTIONS[a].label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const registry = {
  alert_card: AlertCard,
  insight_list: InsightList,
  schedule_list: ScheduleList,
  stats_row: StatsRow,
  standings_card: StandingsCard,
  conflict_summary: ConflictSummary,
  action_row: ActionRow,
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 10, padding: 14, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 8 },
  alert: { marginHorizontal: 16, marginTop: 12, borderRadius: 10, padding: 14, borderLeftWidth: 5 },
  sevPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 6 },
  sevPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  alertTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  alertText: { fontSize: 13, color: colors.text, marginTop: 3, lineHeight: 18 },
  alertAction: { marginTop: 8 },
  alertActionText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  insightRow: { flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F1F2F4', gap: 10 },
  insightDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  insightTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  insightText: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#F1F2F4', gap: 10 },
  scheduleRowHighlight: { backgroundColor: '#FFF8E6', borderRadius: 6 },
  scheduleTime: { width: 46, fontSize: 13, fontWeight: '800', color: colors.primary },
  scheduleName: { fontSize: 14, fontWeight: '700', color: colors.text },
  scheduleVenue: { fontSize: 12, color: colors.muted, marginTop: 1 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusChipText: { fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginHorizontal: 16, marginTop: 12 },
  statCard: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.card, borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  medalHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  medalHeadText: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  medalRow: { flexDirection: 'row', paddingVertical: 7 },
  medalHouse: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  medalCell: { width: 40, textAlign: 'center', fontSize: 14, color: colors.text },
  conflictLine: { fontSize: 13, color: colors.text, lineHeight: 18 },
  link: { color: colors.primary, fontWeight: '700', marginTop: 8, fontSize: 13 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 16, marginTop: 12 },
  actionBtn: { flexGrow: 1, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
