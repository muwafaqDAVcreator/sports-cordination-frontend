import React, { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from '../redux/authSlice';
import { getSavedToken, getSavedUser } from '../services/authService';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EventListScreen from '../screens/EventListScreen';
import EventDetailScreen from '../screens/EventDetailScreen';
import AddEditEventScreen from '../screens/AddEditEventScreen';
import AthleteListScreen from '../screens/AthleteListScreen';
import AddEditAthleteScreen from '../screens/AddEditAthleteScreen';
import ResultsEntryScreen from '../screens/ResultsEntryScreen';
import StandingsScreen from '../screens/StandingsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SyncActivityScreen from '../screens/SyncActivityScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import SyncManager from '../components/SyncManager';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icon = (glyph) => () => <Text style={{ fontSize: 20 }}>{glyph}</Text>;

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#999' }}>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Dashboard', tabBarIcon: icon('📊') }} />
      <Tab.Screen name="Events" component={EventListScreen} options={{ title: 'Events', tabBarIcon: icon('📋') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', tabBarIcon: icon('⚙️') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const dispatch = useDispatch();
  const { token, restoring } = useSelector((s) => s.auth);

  useEffect(() => {
    // Restoring the saved session needs no network, so the app opens offline.
    Promise.all([getSavedToken(), getSavedUser()]).then(([savedToken, user]) => {
      dispatch(restoreSession(savedToken ? { token: savedToken, user } : null));
    });
  }, []);

  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <SyncManager />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="MainApp" component={MainTabs} />
            <Stack.Group screenOptions={{ headerShown: true }}>
              <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
              <Stack.Screen name="AddEvent" component={AddEditEventScreen} options={{ title: 'New Event' }} />
              <Stack.Screen name="EditEvent" component={AddEditEventScreen} options={{ title: 'Edit Event' }} />
              <Stack.Screen name="AthleteList" component={AthleteListScreen} options={{ title: 'Athletes' }} />
              <Stack.Screen name="AddAthlete" component={AddEditAthleteScreen} options={{ title: 'Add Athlete' }} />
              <Stack.Screen name="EditAthlete" component={AddEditAthleteScreen} options={{ title: 'Edit Athlete' }} />
              <Stack.Screen name="ResultsEntry" component={ResultsEntryScreen} options={{ title: 'Enter Results' }} />
              <Stack.Screen name="Standings" component={StandingsScreen} options={{ title: 'Standings' }} />
              <Stack.Screen name="SyncActivity" component={SyncActivityScreen} options={{ title: 'Sync Activity' }} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
              <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
            </Stack.Group>
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
