import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../redux/authSlice';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleRegister = () => {
    if (!name || !email || !phone || !password || !passwordConfirmation) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    dispatch(register({ name, email, phone, password, password_confirmation: passwordConfirmation }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join as a Sports Event Coordinator</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} placeholder="Muwafaq Ahmed" value={name} onChangeText={setName} />

        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} placeholder="+94 77 123 4567" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Min. 8 characters" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput style={styles.input} placeholder="Repeat password" value={passwordConfirmation} onChangeText={setPasswordConfirmation} secureTextEntry />

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Create Account</Text>}
        </TouchableOpacity>

        <Text style={styles.loginText}>
          Already have an account?{' '}
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>Log In</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 22 },
  backBtn: { marginBottom: 20, marginTop: 10 },
  backText: { fontSize: 16, color: '#1F4788', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '800', color: '#1F2430', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8A92A0', marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6472', marginBottom: 7 },
  input: { height: 50, borderWidth: 1.5, borderColor: '#E3E6EC', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#1F2430', marginBottom: 15 },
  registerBtn: { height: 52, backgroundColor: '#1F4788', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 20 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginText: { textAlign: 'center', fontSize: 14, color: '#8A92A0' },
  loginLink: { fontWeight: '600', color: '#1F4788' },
});
