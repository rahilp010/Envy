/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Navbar from '../Navbar';
import api from '../../services/api';
import { SYSTEM_ACCOUNTS } from '../../services/statics';
import { useTheme } from '../../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../../theme/color';

// === SKELETON LOADER ===
const SkeletonCard = ({ COLORS }) => {
  const styles = createStyles(COLORS);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImg} />
      <View style={{ flex: 1 }}>
        <View style={styles.skeletonLineLg} />
        <View style={styles.skeletonLineMd} />
        <View style={styles.skeletonLineSm} />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.skeletonShimmer, { transform: [{ translateX }] }]}
      />
    </View>
  );
};

const LedgerClientList = ({ navigation, route }) => {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  /* ===================== STATE ===================== */
  const { client } = route?.params || 0;
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);

  // Animation
  const slideAnim = useRef(new Animated.Value(220)).current;

  const safeArray = v => (Array.isArray(v) ? v : []);

  useEffect(() => {
    loadClients();
    slideAnim.setValue(200);
  }, []);

  /* ===================== LOGIC ===================== */
  const loadClients = async () => {
    try {
      setRefreshing(true);
      const res = await api.getAllClients();
      setClients(res || []);
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
      setLoading(false); // Make sure loading stops initially too
    }
  };

  const openSearch = () => {
    setShowSearch(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const closeSearch = () => {
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSearch(false);
      setSearch('');
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredClients = safeArray(clients)?.filter(
    item =>
      item.clientName?.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      !SYSTEM_ACCOUNTS.includes(item.clientName.toLowerCase()),
  );

  const filteredAccountLedger = safeArray(clients)?.filter(
    item =>
      item.clientName === 'BANK ACCOUNT' || item.clientName === 'CASH ACCOUNT',
  );

  const data =
    client === 'BANK ACCOUNT' || client === 'CASH ACCOUNT'
      ? filteredAccountLedger
      : filteredClients;

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Navbar title="Ledger" onSearch={openSearch} />

      {/* SEARCH BAR */}
      {showSearch && (
        <Animated.View
          style={[
            styles.searchBar,
            {
              transform: [
                {
                  translateY: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              opacity: searchAnim,
            },
          ]}
        >
          <Icon name="search-outline" size={18} color={COLORS.muted} />
          <TextInput
            ref={searchInputRef}
            placeholder="Search clients..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor={COLORS.muted}
          />
          <TouchableOpacity onPress={closeSearch}>
            <Icon name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* CONTENT */}
      {refreshing && clients.length === 0 ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} COLORS={COLORS} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <Icon name="file-tray-outline" size={42} color={COLORS.muted} />
                <Text style={styles.emptyText}>No data found</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ClientLedgerCard
              item={item}
              navigation={navigation}
              COLORS={COLORS}
            />
          )}
        />
      )}
    </View>
  );
};

export default LedgerClientList;

/* ===================== SUB-COMPONENTS ===================== */

const ClientLedgerCard = ({ item, navigation, COLORS }) => {
  const styles = createStyles(COLORS);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.getLedgerSummary(item._id);
      setStats(res);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('Ledger', { client: item })}
    >
      {/* HEADER */}
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.meta}>
            {item.accountType} • {item.pageName || 'General'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={COLORS.muted} />
      </View>

      {/* STATS */}
      {stats && (
        <View style={styles.statsRow}>
          <StatBox
            label="Debit"
            value={stats.totalDebit}
            color="#DC2626"
            COLORS={COLORS}
          />
          <StatBox
            label="Credit"
            value={stats.totalCredit}
            color="#16A34A"
            COLORS={COLORS}
          />
          <StatBox
            label="Balance"
            value={stats.balance}
            color={stats.balance < 0 ? '#DC2626' : '#16A34A'}
            COLORS={COLORS}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const StatBox = ({ label, value, color, COLORS }) => {
  const styles = createStyles(COLORS);
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>
        ₹ {Math.abs(value).toLocaleString('en-IN')}
      </Text>
    </View>
  );
};

/* ===================== STYLES ===================== */

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },

    // Search
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      marginHorizontal: 16,
      marginBottom: 10,
      paddingHorizontal: 12,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: COLORS.text,
    },

    // Client Card
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
      // Soft Shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    clientName: {
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.text,
    },
    meta: {
      fontSize: 12,
      color: COLORS.muted,
      marginTop: 2,
      fontWeight: '500',
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
      gap: 8,
    },
    statBox: {
      flex: 1,
      backgroundColor: COLORS.bg,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    statLabel: {
      fontSize: 11,
      color: COLORS.muted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    statValue: {
      fontSize: 14,
      fontWeight: '800',
      marginTop: 4,
    },

    // Empty State
    empty: {
      alignItems: 'center',
      marginTop: 200,
    },
    emptyText: {
      marginTop: 10,
      color: COLORS.muted,
      fontSize: 14,
    },

    // Skeleton
    skeletonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 20,
      padding: 16,
      marginBottom: 14,
      overflow: 'hidden',
    },
    skeletonImg: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: COLORS.border,
      marginRight: 12,
    },
    skeletonLineLg: {
      height: 14,
      width: '60%',
      borderRadius: 8,
      backgroundColor: COLORS.border,
      marginBottom: 8,
    },
    skeletonLineMd: {
      height: 12,
      width: '45%',
      borderRadius: 8,
      backgroundColor: COLORS.border,
      marginBottom: 6,
    },
    skeletonLineSm: {
      height: 10,
      width: '35%',
      borderRadius: 8,
      backgroundColor: COLORS.border,
    },
    skeletonShimmer: {
      position: 'absolute',
      top: 0,
      left: -150,
      width: 150,
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.2)', // Light shimmer
    },
  });
