import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { addAthlete, editAthlete } from '../redux/athletesSlice';

export default function AddEditAthleteScreen({ route, navigation }) {
  const { eventId, athlete } = route.params;
  const dispatch = useDispatch();
  const isEditing = !!athlete;

  const [form, setForm] = useState({
    name: athlete?.name || '',
    bibNumber: athlete?.bib_number?.toString() || '',
    age: athlete?.age?.toString() || '',
    house: athlete?.house || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Athlete name is required');
      return;
    }

    const data = {
      name: form.name,
      bib_number: form.bibNumber ? parseInt(form.bibNumber, 10) : null,
      age: form.age ? parseInt(form.age, 10) : null,
      house: form.house || null,
    };

    setLoading(true);
    try {
      if (isEditing) {
        await dispatch(editAthlete({ athleteId: athlete.id, data })).unwrap();
        Alert.alert('Success', 'Athlete updated');
      } else {
        await dispatch(addAthlete({ eventId, data })).unwrap();
        Alert.alert('Success', 'Athlete added');
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err || 'Failed to save athlete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{isEditing ? 'Edit Athlete' : 'Add Athlete'}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} placeholder="Athlete name" value={form.name} onChangeText={(text) => setForm({ ...form, name: text })} editable={!loading} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bib Number</Text>
          <TextInput style={styles.input} placeholder="e.g., 101" value={form.bibNumber} onChangeText={(text) => setForm({ ...form, bibNumber: text })} keyboardType="numeric" editable={!loading} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} placeholder="e.g., 18" value={form.age} onChangeText={(text) => setForm({ ...form, age: text })} keyboardType="numeric" editable={!loading} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>House</Text>
          <TextInput style={styles.input} placeholder="e.g., Blue House" value={form.house} onChangeText={(text) => setForm({ ...form, house: text })} editable={!loading} />
        </View>

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEditing ? 'Update Athlete' : 'Add Athlete'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  form: { padding: 20, gap: 16 },
  formGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  button: { backgroundColor: '#1F4788', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  cancelButton: { textAlign: 'center', color: '#1F4788', fontSize: 14, fontWeight: '600', marginTop: 12 },
});
