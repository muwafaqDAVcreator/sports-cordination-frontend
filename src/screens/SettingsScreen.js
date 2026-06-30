import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice';
import { runSync } from '../redux/syncSlice';

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isOnline, pendingCount, syncing } = useSelector((state) => state.sync);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are offline. Connect to the internet to sync.');
      return;
    }
    const result = await dispatch(runSync()).unwrap();
    Alert.alert('Sync Complete', `${result.succeeded} change(s) synced${result.failed ? `, ${result.failed} failed` : ''}.`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>{user?.role === 'admin' ? 'Administrator' : 'Coordinator'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <Row label="Email" value={user?.email} />
        <Row label="Phone" value={user?.phone} />
        <Row label="House" value={user?.house} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <Row label="Connection" value={isOnline ? 'Online' : 'Offline'} />
        <Row label="Pending changes" value={pendingCount} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleSync} disabled={syncing}>
          {syncing ? <ActivityIndicator color="#1F4788" /> : <Text style={styles.actionButtonText}>🔄 Sync Now</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.actionButtonText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('ChangePassword')}>
          <Text style={styles.actionButtonText}>🔒 Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  profileCard: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1F4788', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: '#333' },
  role: { fontSize: 13, color: '#999', marginTop: 4 },
  section: { backgroundColor: '#fff', marginTop: 12, paddingHorizontal: 20, paddingVertical: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#999', marginVertical: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, color: '#333', fontWeight: '600' },
  actions: { padding: 20, gap: 10 },
  actionButton: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#1F4788' },
  logoutButton: { backgroundColor: '#FDECEA' },
  logoutButtonText: { fontSize: 14, fontWeight: '600', color: '#E74C3C' },
});
