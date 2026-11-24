import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { saveAthlete } from '../redux/actions';
import { colors } from '../theme';

const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];

export default function AddEditAthleteScreen({ route, navigation }) {
  const { eventUuid, athleteUuid } = route.params;
  const existing = useSelector((s) => s.data.athletes.find((a) => a.uuid === athleteUuid)) || null;
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    name: existing?.name || '',
    bib_number: existing?.bib_number != null ? String(existing.bib_number) : '',
    age: existing?.age != null ? String(existing.age) : '',
    house: existing?.house || '',
  });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    try {
      await dispatch(saveAthlete(eventUuid, form, existing));
      navigation.goBack();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else Alert.alert('Error', err.message || 'Could not save athlete');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Name *</Text>
      <TextInput style={[styles.input, errors.name && styles.inputError]} placeholder="Athlete name" value={form.name} onChangeText={set('name')} accessibilityLabel="Athlete name" />
      {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

      <Text style={styles.label}>Bib number</Text>
      <TextInput style={[styles.input, errors.bib_number && styles.inputError]} placeholder={existing ? '' : 'Leave blank to auto-assign'} value={form.bib_number} onChangeText={set('bib_number')} keyboardType="numeric" accessibilityLabel="Bib number" />
      {errors.bib_number ? <Text style={styles.error}>{errors.bib_number}</Text> : null}

      <Text style={styles.label}>Age</Text>
      <TextInput style={[styles.input, errors.age && styles.inputError]} placeholder="e.g. 18" value={form.age} onChangeText={set('age')} keyboardType="numeric" accessibilityLabel="Age" />
      {errors.age ? <Text style={styles.error}>{errors.age}</Text> : null}

      <Text style={styles.label}>House</Text>
      <View style={styles.houses}>
        {HOUSES.map((h) => (
          <TouchableOpacity key={h} style={[styles.house, form.house === h && styles.houseActive]} onPress={() => set('house')(form.house === h ? '' : h)}>
            <Text style={[styles.houseText, form.house === h && styles.houseTextActive]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="...or type another house/team" value={HOUSES.includes(form.house) ? '' : form.house} onChangeText={set('house')} accessibilityLabel="Custom house" />

      <TouchableOpacity style={styles.button} onPress={handleSave} accessibilityRole="button">
        <Text style={styles.buttonText}>{existing ? 'Save Changes' : 'Add Athlete'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  form: { padding: 16, gap: 8, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 6 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 12 },
  houses: { flexDirection: 'row', gap: 8 },
  house: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center' },
  houseActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  houseText: { fontWeight: '700', color: colors.text },
  houseTextActive: { color: '#fff' },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
