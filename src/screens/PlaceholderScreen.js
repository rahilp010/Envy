import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import Card from '../components/common/Card';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PlaceholderScreen({ route, navigation }) {
  const title = route?.params?.title || route?.name || 'Screen';
  const subtitle = route?.params?.subtitle || 'Module Scheduled for Day 2 / Day 3';
  const icon = route?.params?.icon || 'clock-outline';

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={title} subtitle={subtitle} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={icon} size={40} color="#daf4aa" />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            This module is part of the 3-day migration plan and will be implemented in Day 2 or Day 3.
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SCHEDULED IN PLAN</Text>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161b',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    alignItems: 'center',
    padding: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
