import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Switch,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';

const COLORS = {
  bg: '#FAFBFC',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#111827',
  accentBlue: '#EFF6FF',
  accentGreen: '#E6F7E9',
  accentRed: '#FCE8E6',
};

const Settings = ({ navigation }) => {
  const translateAnim = useRef(new Animated.Value(12)).current;

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: translateAnim }],
        },
      ]}
    >
      <Navbar title="Settings" page="settings" />

      <View style={styles.safe}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        >
          {/* HEADER */}

          {/* ACCOUNT */}
          <Section title="Account">
            <Row
              icon="person-outline"
              label="About"
              onPress={() => navigation.navigate('About')}
            />
            <Row
              icon="shield-checkmark-outline"
              label="Configurations"
              isLast
            />
          </Section>

          {/* PREFERENCES */}
          <Section title="Preferences">
            <ToggleRow
              icon="moon-outline"
              label="Dark Mode"
              value={darkMode}
              onChange={setDarkMode}
            />
            <ToggleRow
              icon="notifications-outline"
              label="Notifications"
              value={notifications}
              onChange={setNotifications}
            />
            <ToggleRow
              icon="finger-print-outline"
              label="Biometric Lock"
              value={biometric}
              onChange={setBiometric}
              isLast
            />
          </Section>

          {/* SYSTEM */}
          <Section title="System">
            <Row icon="cloud-outline" label="Backup & Sync" />
            <Row icon="refresh-outline" label="Check For Update" isLast />
          </Section>

          {/* DANGER ZONE */}
          <Section title="Danger Zone">
            <Row icon="log-out-outline" label="Logout" danger isLast />
          </Section>
        </ScrollView>
      </View>

      <BottomNav navigation={navigation} active="settings" />
    </Animated.View>
  );
};

/* ---------------- COMPONENTS ---------------- */

const Section = ({ title, children }) => (
  <View style={{ marginBottom: 28 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const Row = ({ icon, label, danger, isLast, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.row, isLast && styles.lastRow]}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={[styles.iconBox, danger && styles.dangerIcon]}>
          <Icon
            name={icon}
            size={20}
            color={danger ? '#DC2626' : COLORS.text}
          />
        </View>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>
          {label}
        </Text>
        <Icon name="chevron-forward" size={18} color={COLORS.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const ToggleRow = ({ icon, label, value, onChange, isLast }) => (
  <View style={[styles.row, isLast && styles.lastRow]}>
    <View style={styles.iconBox}>
      <Icon name={icon} size={20} color={COLORS.text} />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      thumbColor={value ? COLORS.primary : '#9CA3AF'}
      trackColor={{ false: '#E5E7EB', true: '#D1D5DB' }}
    />
  </View>
);

export default Settings;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safe: {
    marginBottom: 160,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dangerIcon: {
    backgroundColor: COLORS.accentRed,
  },
  dangerText: {
    color: '#DC2626',
  },
  version: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    marginVertical: 30,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
