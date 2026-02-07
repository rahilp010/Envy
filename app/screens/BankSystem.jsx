import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import AnimatedCounter from '../utility/AnimatedCounter';
import api from '../services/api';
import Loading from '../animation/Loading';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

export default function BankSystem({ navigation }) {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  // Animation Refs
  const translateAnim = useRef(new Animated.Value(12)).current;
  const balanceOpacity = useRef(new Animated.Value(1)).current;

  // State
  const [activeAccount, setActiveAccount] = useState('BANK ACCOUNT');
  const [showBalance, setShowBalance] = useState(true);
  const [account, setAccount] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial Load Animation
  useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: 0,
      friction: 7,
      useNativeDriver: true,
    }).start();
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const res = await api.getAllAccounts();
      setAccount(res);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const safeArray = v => (Array.isArray(v) ? v : []);
  const currentAccount = safeArray(account).find(
    acc => acc?.clientId?.clientName === activeAccount,
  );
  const currentBalance = currentAccount?.currentBalance || 0;

  const toggleEye = () => {
    Animated.sequence([
      Animated.timing(balanceOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(balanceOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setShowBalance(prev => !prev), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Navbar title="Bank" page="bank" />

      {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ transform: [{ translateY: translateAnim }] }}
      >
        {/* ===================== BALANCE CARD ===================== */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity
              onPress={toggleEye}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: balanceOpacity }}>
            {showBalance ? (
              <AnimatedCounter
                value={currentBalance}
                style={styles.balanceAmount}
              />
            ) : (
              <Text style={styles.balanceAmount}>••••••••</Text>
            )}
          </Animated.View>

          {/* TABS (Pills) */}
          <View style={styles.tabContainer}>
            <TabPill
              label="Bank"
              isActive={activeAccount === 'BANK ACCOUNT'}
              onPress={() => setActiveAccount('BANK ACCOUNT')}
            />
            <TabPill
              label="Cash"
              isActive={activeAccount === 'CASH ACCOUNT'}
              onPress={() => setActiveAccount('CASH ACCOUNT')}
            />
          </View>

          {/* QUICK ACTIONS ROW */}
          <View style={styles.actionRow}>
            <ActionBtn icon="add" label="Add" />
            <ActionBtn icon="arrow-up" label="Withdraw" />
            <ActionBtn
              icon="swap-horizontal"
              label="Transfer"
              onPress={() => navigation.navigate('Transfer')}
            />
            <ActionBtn
              icon="document-text-outline"
              label="Ledger"
              onPress={() =>
                navigation.navigate('LedgerClientList', {
                  client: activeAccount,
                })
              }
            />
          </View>
        </View>

        {/* ===================== SERVICES GRID ===================== */}
        <Text style={styles.sectionTitle}>Services</Text>

        <View style={styles.gridContainer}>
          <ServiceCard
            icon="wallet-outline"
            label="Accounts"
            onPress={() => navigation.navigate('Account')}
          />
          <ServiceCard
            icon="bar-chart-outline"
            label="Analytics"
            onPress={() => navigation.navigate('Analytics')}
          />
          <ServiceCard
            icon="people-outline"
            label="Clients"
            onPress={() => navigation.navigate('LedgerClientList')}
          />
          {/* <ServiceCard
            icon="receipt-outline"
            label="Reports"
            onPress={() => {}}
          /> */}
        </View>

        {/* ===================== SPACER ===================== */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <BottomNav navigation={navigation} active="bank" />
    </View>
  );
}

/* ===================== SUB-COMPONENTS ===================== */

const TabPill = ({ label, isActive, onPress }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  return (
    <TouchableOpacity
      style={[styles.pill, isActive && styles.pillActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const ActionBtn = ({ icon, label, onPress }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
      <TouchableOpacity
        style={styles.actionCircle}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <Ionicons name={icon} size={22} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.actionLabel}>{label}</Text>
    </Animated.View>
  );
};

const ServiceCard = ({ icon, label, onPress }) => {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View
      style={{ transform: [{ scale }], width: '48%', marginBottom: 16 }}
    >
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
      >
        <View style={styles.serviceIconBox}>
          <Ionicons name={icon} size={24} color={COLORS.text} />
        </View>
        <Text style={styles.serviceText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ===================== STYLES ===================== */

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // === Main Card ===
    mainCard: {
      backgroundColor: COLORS.card,
      borderRadius: 28,
      padding: 24,
      marginBottom: 24,
      // Soft Shadow (Matches Settings/Profile)
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 15,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'center', // Centered alignment
      alignItems: 'center',
      marginBottom: 8,
      position: 'relative',
    },
    balanceLabel: {
      fontSize: 14,
      color: COLORS.muted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    eyeBtn: {
      position: 'absolute',
      right: 0,
      top: -2,
    },
    balanceAmount: {
      fontSize: 36,
      fontWeight: '800',
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 24,
      letterSpacing: -1,
    },

    // === Tabs ===
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: COLORS.bg, // Subtle inner container
      borderRadius: 20,
      padding: 4,
      marginBottom: 24,
    },
    pill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 16,
    },
    pillActive: {
      backgroundColor: COLORS.card, // White on light, dark on dark
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    pillText: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.muted,
    },
    pillTextActive: {
      color: COLORS.text,
      fontWeight: '700',
    },

    // === Actions ===
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    actionCircle: {
      width: 54,
      height: 54,
      borderRadius: 18, // Squircle shape like Settings icons
      backgroundColor: COLORS.bg === '#000000' ? '#222' : '#F5F7FF', // Matches Profile icons
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.text,
    },

    // === Section Header ===
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.muted,
      marginBottom: 16,
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // === Grid ===
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    serviceCard: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      // Soft shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 10,
      elevation: 2,
    },
    serviceIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: COLORS.bg === '#000000' ? '#222' : '#F5F7FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    serviceText: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
    },
  });
