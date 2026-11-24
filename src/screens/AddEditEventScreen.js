import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { saveEvent } from '../redux/actions';
import { selectEvent } from '../redux/dataSlice';
import { todayString } from '../logic/sdui';
import { colors } from '../theme';

function Field({ label, error, children }) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function AddEditEventScreen({ route, navigation }) {
  const eventUuid = route.params?.eventUuid;
  const existing = useSelector(selectEvent(eventUuid));
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: existing?.name || '',
    discipline: existing?.discipline || '',
    event_date: existing?.event_date || todayString(),
    start_time: existing?.start_time || '',
    end_time: existing?.end_time || '',
    venue: existing?.venue || '',
    officials_required: String(existing?.officials_required ?? ''),
    officials_assigned: String(existing?.officials_assigned ?? ''),
  });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    try {
      await dispatch(saveEvent(form, existing));
      navigation.goBack();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else Alert.alert('Error', err.message || 'Could not save event');
    }
  };

  const input = (key, props = {}) => (
    <TextInput style={[styles.input, errors[key] && styles.inputError]} value={form[key]} onChangeText={set(key)} accessibilityLabel={key} {...props} />
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Field label="Event name *" error={errors.name}>{input('name', { placeholder: 'e.g. 100m Final' })}</Field>
        <Field label="Discipline" error={errors.discipline}>{input('discipline', { placeholder: 'Track, Field, Swimming...' })}</Field>
        <Field label="Date * (YYYY-MM-DD)" error={errors.event_date}>{input('event_date', { placeholder: todayString() })}</Field>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field label="Start * (HH:MM)" error={errors.start_time}>{input('start_time', { placeholder: '09:00' })}</Field></View>
          <View style={{ flex: 1 }}><Field label="End (HH:MM)" error={errors.end_time}>{input('end_time', { placeholder: '10:00' })}</Field></View>
        </View>
        <Field label="Venue" error={errors.venue}>{input('venue', { placeholder: 'e.g. Main Track' })}</Field>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field label="Officials required" error={errors.officials_required}>{input('officials_required', { keyboardType: 'numeric', placeholder: '0' })}</Field></View>
          <View style={{ flex: 1 }}><Field label="Officials assigned" error={errors.officials_assigned}>{input('officials_assigned', { keyboardType: 'numeric', placeholder: '0' })}</Field></View>
        </View>
        <Text style={styles.hint}>Officials are used by the analytics engine to flag resource shortfalls on the dashboard.</Text>

        <TouchableOpacity style={styles.button} onPress={handleSave} accessibilityRole="button">
          <Text style={styles.buttonText}>{existing ? 'Save Changes' : 'Create Event'}</Text>
        </TouchableOpacity>
        <Text style={styles.offlineNote}>Saved on this device instantly and synced when online.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 16, gap: 12, paddingBottom: 40 },
  group: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12 },
  hint: { color: colors.muted, fontSize: 12 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  offlineNote: { textAlign: 'center', color: colors.muted, fontSize: 12 },
});
