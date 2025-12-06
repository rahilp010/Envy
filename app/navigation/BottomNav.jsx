/* eslint-disable react/no-unstable-nested-components */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import InventoryScreen from '../screens/InventoryScreen';
import AddProduct from '../screens/Product';
import Scanner from '../screens/Scanner';
import EditProduct from '../screens/EditProduct';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function BottomNav() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#111',
          // paddingTop: 20
        },
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#777',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddProduct"
        component={AddProduct}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="add" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={Scanner}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="scan" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="EditProduct"
        component={EditProduct}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
