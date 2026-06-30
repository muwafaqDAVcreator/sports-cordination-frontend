import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { setToken } from '../redux/authSlice';
import { getSavedToken } from '../services/authService';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import AthleteListScreen from '../screens/AthleteListScreen';
import AddEditAthleteScreen from '../screens/AddEditAthleteScreen';
import ResultsEntryScreen from '../screens/ResultsEntryScreen';
import StandingsScreen from '../screens/StandingsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import SyncManager from '../components/SyncManager';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DashboardTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true, tabBarActiveTintColor: '#1F4788', tabBarInactiveTintColor: '#999' }}>
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ title: 'Dashboard', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📊</Text> }}
      />
      <Tab.Screen
        name="Events"
        component={EventListScreen}
        options={{ title: 'Events', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

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
      <SyncManager />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="MainApp" component={DashboardTabs} />
            <Stack.Screen
              name="AthleteList"
              component={AthleteListScreen}
              options={{ headerShown: true, title: 'Athletes' }}
            />
            <Stack.Screen
              name="AddAthlete"
              component={AddEditAthleteScreen}
              options={{ headerShown: true, title: 'Add Athlete' }}
            />
            <Stack.Screen
              name="EditAthlete"
              component={AddEditAthleteScreen}
              options={{ headerShown: true, title: 'Edit Athlete' }}
            />
            <Stack.Screen
              name="ResultsEntry"
              component={ResultsEntryScreen}
              options={{ headerShown: true, title: 'Results' }}
            />
            <Stack.Screen
              name="Standings"
              component={StandingsScreen}
              options={{ headerShown: true, title: 'Standings' }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: true, title: 'Edit Profile' }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: true, title: 'Change Password' }}
            />
          </>
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
