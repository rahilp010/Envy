import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../theme/ThemeContext';
import { LightTheme, DarkTheme } from '../theme/color';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Settings = ({ navigation }) => {
  const { theme, toggleTheme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const translateAnim = useRef(new Animated.Value(12)).current;

  // State
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  // Animation on Mount
  useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  // Load Preferences
  useEffect(() => {
    const loadBiometricSetting = async () => {
      const saved = await AsyncStorage.getItem('biometricEnabled');
      setBiometric(saved === 'true');
    };
    loadBiometricSetting();
  }, []);

  const toggleBiometric = async value => {
    setBiometric(value);
    await AsyncStorage.setItem('biometricEnabled', value ? 'true' : 'false');
  };

  return (
    <View style={styles.container}>
      <Navbar title="Settings" page="settings" />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent]}
        style={{ transform: [{ translateY: translateAnim }] }}
      >
        {/* SECTION: ACCOUNT */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.sectionContainer}>
          <SettingsRow
            icon="person-outline"
            label="About"
            onPress={() => navigation.navigate('About')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Configurations"
            isLast
          />
        </View>

        {/* SECTION: PREFERENCES */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.sectionContainer}>
          <SettingsRow
            icon="moon-outline"
            label="Dark Mode"
            type="toggle"
            value={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <SettingsRow
            icon="notifications-outline"
            label="Notifications"
            type="toggle"
            value={notifications}
            onToggle={setNotifications}
          />
          <SettingsRow
            icon="finger-print-outline"
            label="Biometric Lock"
            type="toggle"
            value={biometric}
            onToggle={toggleBiometric}
            isLast
          />
        </View>

        {/* SECTION: SYSTEM */}
        <Text style={styles.sectionTitle}>System</Text>
        <View style={styles.sectionContainer}>
          <SettingsRow icon="cloud-outline" label="Backup & Sync" />
          <SettingsRow icon="refresh-outline" label="Check For Update" isLast />
        </View>

        {/* Spacer for BottomNav */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <BottomNav navigation={navigation} active="settings" />
    </View>
  );
};

/* ---------------- REUSABLE COMPONENT ---------------- */

const SettingsRow = ({
  icon,
  label,
  isLast,
  type = 'arrow',
  value,
  onToggle,
  onPress,
  isDestructive,
}) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.row, isLast && styles.lastRow]}
        onPress={type === 'toggle' ? () => onToggle(!value) : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={type === 'toggle'}
      >
        <View style={styles.rowLeft}>
          <View
            style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}
          >
            <Icon
              name={icon}
              size={22}
              color={isDestructive ? '#FF3B30' : COLORS.text}
            />
          </View>
          <Text
            style={[styles.rowLabel, isDestructive && styles.textDestructive]}
          >
            {label}
          </Text>
        </View>

        <View style={styles.rowRight}>
          {type === 'toggle' ? (
            <Switch
              trackColor={{ false: '#E5E7EB', true: COLORS.primary }}
              thumbColor={'#fff'}
              ios_backgroundColor="#E5E7EB"
              onValueChange={onToggle}
              value={value}
            />
          ) : (
            <Icon name="chevron-forward" size={20} color={COLORS.muted} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Settings;

/* ---------------- STYLES ---------------- */

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.muted,
      marginBottom: 12,
      marginTop: 8,
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionContainer: {
      backgroundColor: COLORS.card,
      borderRadius: 24, // Matches Profile
      padding: 8,
      marginBottom: 16,
      // Soft shadow exactly like Profile/Home
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.03)',
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: '#F5F7FF', // Subtle Blue/Grey from Profile
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    iconBoxDestructive: {
      backgroundColor: '#FFF2F2',
    },
    rowLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
    },
    textDestructive: {
      color: '#FF3B30',
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    versionText: {
      textAlign: 'center',
      color: COLORS.muted,
      fontSize: 12,
      marginTop: 10,
      marginBottom: 20,
    },
  });
