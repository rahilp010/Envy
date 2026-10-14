import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { navigationRef } from './navigationRef';
import StackNavigator from './StackNavigator';

export default function AppNavigator() {
  const isAuthenticated = useSelector((state) => state.envy.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      <StackNavigator isAuthenticated={isAuthenticated} />
    </NavigationContainer>
  );
}
