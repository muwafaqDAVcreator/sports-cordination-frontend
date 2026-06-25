import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../redux/authSlice';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    dispatch(login({ email, password }));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🏅</Text>
        </View>
        <Text style={styles.title}>SPORTS EVENT{'\n'}COORDINATOR</Text>
        <Text style={styles.subtitle}>Offline-First System</Text>

        <Text style={styles.label}>Email / Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Log In</Text>}
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Text style={styles.signupLink} onPress={() => navigation.navigate('Register')}>Sign Up</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 26, justifyContent: 'center' },
  logo: { width: 74, height: 74, borderRadius: 20, backgroundColor: '#1F4788', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  logoIcon: { fontSize: 36 },
  title: { textAlign: 'center', fontSize: 21, fontWeight: '800', color: '#1F2430', letterSpacing: 0.4, lineHeight: 28 },
  subtitle: { textAlign: 'center', fontSize: 14, color: '#8A92A0', marginTop: 8, marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: '#5A6472', marginBottom: 7 },
  input: { height: 52, borderWidth: 1.5, borderColor: '#E3E6EC', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#1F2430', marginBottom: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 22 },
  forgotText: { fontSize: 13, fontWeight: '600', color: '#1F4788' },
  loginBtn: { height: 52, backgroundColor: '#1F4788', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signupText: { textAlign: 'center', fontSize: 14, color: '#8A92A0' },
  signupLink: { fontWeight: '600', color: '#1F4788' },
});
