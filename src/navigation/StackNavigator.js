import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DrawerNavigator from './DrawerNavigator';
import AuthScreen from '../screens/AuthScreen';

const Stack = createStackNavigator();

export default function StackNavigator({ isAuthenticated }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#16161b' },
      }}
      initialRouteName={isAuthenticated ? 'MainDrawer' : 'Auth'}
    >
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}
