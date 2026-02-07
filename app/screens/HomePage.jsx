import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Report from '../../assets/report.svg'; // Ensure this path is correct
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

const { width } = Dimensions.get('window');

function HomeScreenContent({ navigation }) {
  /* ===================== THEME & STYLES ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const insets = useSafeAreaInsets();

  /* ===================== ANIMATIONS ===================== */
  const scaleHome = useRef(new Animated.Value(1)).current;
  const scaleProfile = useRef(new Animated.Value(1)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  /* ===================== STATE ===================== */
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem('authUser');
      if (name) setUsername(JSON.parse(name).name);
    };
    loadUser();
  }, []);

  const animateTab = scaleRef => {
    Animated.sequence([
      Animated.spring(scaleRef, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(scaleRef, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateFab = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 0.85, useNativeDriver: true }),
      Animated.spring(fabScale, {
        toValue: 1,
        friction: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom }, // Extra padding for bottom nav
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuCircle}
            onPress={() => navigation.navigate('ProfileDrawer')} // Or navigation.openDrawer() if using drawer nav
          >
            <Icon name="menu-outline" size={32} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconCircle}>
            <Icon name="notifications-outline" size={24} color={COLORS.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        {/* TITLE */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>
            Hi {username.split(' ')[0] || 'Envy'},{'\n'}How can I help{'\n'}you
            today?
          </Text>
        </View>

        {/* GRID BUTTONS */}
        <View style={styles.grid}>
          <Card
            icon="cube-outline"
            label="Products"
            color="#DFF4FB"
            onPress={() => navigation.navigate('Product')}
          />
          <Card
            icon="people-outline"
            label="Clients"
            color="#FCE8E6"
            onPress={() => navigation.navigate('Client')}
          />
          <Card
            icon="cart-outline"
            label="Purchase"
            color="#E6F7E9"
            onPress={() => navigation.navigate('Purchase')}
          />
          <Card
            icon="cash-outline"
            label="Sales"
            color="#FFF2C6"
            onPress={() => navigation.navigate('Sales')}
          />

          {/* FULL WIDTH BANKING CARD */}
          <FullWidthCard
            icon="business-outline"
            label="Digital Banking Platform"
            color="#E8EAFE"
            onPress={() => navigation.navigate('BankSystem')}
          />
        </View>
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNavWrapper, { bottom: 20 + insets.bottom }]}>
        <View style={styles.navRow}>
          <View style={styles.navContent}>
            {/* HOME TAB */}
            <Animated.View style={{ transform: [{ scale: scaleHome }] }}>
              <TouchableOpacity
                style={
                  activeTab === 'home' ? styles.navIconActive : styles.navIcon
                }
                onPress={() => {
                  setActiveTab('home');
                  animateTab(scaleHome);
                }}
              >
                <Icon
                  name="home-outline"
                  size={24}
                  // Logic: If active, icon is text color (dark/light). If inactive, white.
                  color={activeTab === 'home' ? COLORS.text : '#fff'}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* PROFILE TAB */}
            <Animated.View style={{ transform: [{ scale: scaleProfile }] }}>
              <TouchableOpacity
                style={
                  activeTab === 'profile'
                    ? styles.navIconActive
                    : styles.navIcon
                }
                onPress={() => {
                  animateTab(scaleProfile);
                  navigation.navigate('Settings');
                }}
              >
                <Icon
                  name="settings-outline"
                  size={24}
                  color={activeTab === 'profile' ? COLORS.text : '#fff'}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* FAB */}
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <TouchableOpacity
              style={styles.fabInline}
              onPress={() => {
                animateFab();
                navigation.navigate('Report');
              }}
              activeOpacity={0.9}
            >
              <Report width={28} height={28} fill="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

// === REUSABLE COMPONENTS (Theme Aware) ===

const Card = ({ icon, label, color, onPress }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  // In Dark Mode: Background is card color, "color" prop used for icon background
  const bgColor = theme === 'dark' ? COLORS.card : color;
  const iconBg = theme === 'dark' ? color : 'rgba(255,255,255,0.4)';
  const iconColor = theme === 'dark' ? '#000' : '#000'; // Keep icon dark for contrast on pastel

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={28} color={iconColor} />
      </View>
      <Text style={styles.cardText}>{label}</Text>
    </TouchableOpacity>
  );
};

const FullWidthCard = ({ icon, label, color, onPress }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  const bgColor = theme === 'dark' ? COLORS.card : color;
  const iconBg = theme === 'dark' ? color : 'rgba(255,255,255,0.5)';
  const iconColor = '#000';

  return (
    <TouchableOpacity
      style={[styles.fullWidthCard, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.fullIconWrapper, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={25} color={iconColor} />
      </View>
      <Text style={styles.fullCardText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaProvider>
      <HomeScreenContent navigation={navigation} />
    </SafeAreaProvider>
  );
}

/* ================= STYLES ================= */

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 32,
    },
    iconCircle: {
      backgroundColor: COLORS.card,
      padding: 12,
      borderRadius: 50,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.02)',
    },
    menuCircle: {
      padding: 12,
      borderRadius: 50,
      position: 'absolute',
      top: 0,
      left: -12,
    },
    badge: {
      width: 10,
      height: 10,
      backgroundColor: '#FF3B30',
      borderRadius: 5,
      position: 'absolute',
      right: 12,
      top: 10,
      borderWidth: 1.5,
      borderColor: COLORS.card,
    },
    titleSection: {
      marginBottom: 40,
    },
    title: {
      fontSize: 34,
      fontWeight: '800',
      lineHeight: 42,
      color: COLORS.text,
      letterSpacing: -0.5,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    card: {
      width: '48%',
      aspectRatio: 1.1,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    iconWrapper: {
      marginBottom: 12,
      padding: 8,
      borderRadius: 16,
    },
    cardText: {
      fontWeight: '600',
      fontSize: 16,
      color: COLORS.text,
    },
    fullWidthCard: {
      width: '100%',
      height: 110,
      borderRadius: 26,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    fullIconWrapper: {
      padding: 10,
      borderRadius: 18,
      marginRight: 16,
    },
    fullCardText: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
    },
    bottomNavWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 10,
      paddingHorizontal: 24,
    },
    navRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    navContent: {
      flexDirection: 'row',
      backgroundColor: COLORS.primary, // Keeps primary color for nav bar
      borderRadius: 35,
      padding: 6,
      paddingHorizontal: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
    },
    navIcon: {
      padding: 14,
      paddingHorizontal: 22,
    },
    navIconActive: {
      padding: 14,
      paddingHorizontal: 22,
      backgroundColor: COLORS.card, // Light/Dark card color
      borderRadius: 28,
    },
    fabInline: {
      backgroundColor: COLORS.primary,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  });
