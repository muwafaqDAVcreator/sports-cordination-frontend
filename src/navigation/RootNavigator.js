import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { setToken } from '../redux/authSlice';
import { getSavedToken } from '../services/authService';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    getSavedToken().then((saved) => {
      if (saved) dispatch(setToken(saved));
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="Dashboard" component={PlaceholderDashboard} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function PlaceholderDashboard() {
  const { user } = useSelector((state) => state.auth);
  const { View, Text } = require('react-native');
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24 }}>🏅</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1F2430', marginTop: 12 }}>
        Welcome, {user?.name || 'Coordinator'}!
      </Text>
      <Text style={{ fontSize: 14, color: '#8A92A0', marginTop: 6 }}>Dashboard coming in Module 2</Text>
    </View>
  );
}
