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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Navbar from '../Navbar';
import api from '../../services/api';
import { SYSTEM_ACCOUNTS } from '../../services/statics';

const SkeletonCard = () => {
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
    outputRange: [-300, 300], // ✅ FULL CARD WIDTH
  });

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImg} />

      <View style={{ flex: 1 }}>
        <View style={styles.skeletonLineLg} />
        <View style={styles.skeletonLineMd} />
        <View style={styles.skeletonLineSm} />
      </View>

      {/* ✅ FULL WIDTH SHIMMER OVERLAY */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const LedgerClientList = ({ navigation, route }) => {
  const { client } = route?.params || 0;
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const filterAnim = useRef(new Animated.Value(300)).current;

  const [filterClientId, setFilterClientId] = useState(null);
  const [filterClientName, setFilterClientName] = useState('');

  const slideAnim = useRef(new Animated.Value(220)).current;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setRefreshing(true);
      const res = await api.getAllClients();
      setClients(res || []);
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
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
    slideAnim.setValue(200);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400); // ✅ 400ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  const openFilter = () => {
    setFilterVisible(true);
    Animated.timing(filterAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilter = () => {
    Animated.timing(filterAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setFilterVisible(false));
  };

  const filteredClients = clients?.filter(
    item =>
      item.clientName?.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      !SYSTEM_ACCOUNTS.includes(item.clientName.toLowerCase()),
  );

  const filteredAccountLedger = clients?.filter(
    item =>
      item.clientName === 'BANK ACCOUNT' || item.clientName === 'CASH ACCOUNT',
  );

  const data =
    client === 'BANK ACCOUNT' || client === 'CASH ACCOUNT'
      ? filteredAccountLedger
      : filteredClients;

  return (
    <View style={styles.container}>
      <Navbar title="Ledger" onSearch={openSearch} />

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
          <Icon name="search-outline" size={18} color="#6B7280" />

          <TextInput
            ref={searchInputRef}
            placeholder="Search product..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity onPress={closeSearch}>
            <Icon name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {refreshing && clients.length === 0 ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            !loading && (
              <View style={styles.empty}>
                <Icon name="journal-outline" size={42} color="#9CA3AF" />
                <Text style={styles.emptyText}>No clients found</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <ClientLedgerCard item={item} navigation={navigation} />
          )}
        />
      )}
    </View>
  );
};

export default LedgerClientList;

const ClientLedgerCard = ({ item, navigation }) => {
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
      onPress={() =>
        navigation.navigate('Ledger', {
          client: item,
        })
      }
    >
      {/* HEADER */}
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.meta}>
            {item.accountType} • {item.pageName}
          </Text>
        </View>

        <Icon name="chevron-forward" size={20} color="#9CA3AF" />
      </View>

      {/* STATS */}
      {stats && (
        <View style={styles.statsRow}>
          <StatBox label="Debit" value={stats.totalDebit} color="#DC2626" />
          <StatBox label="Credit" value={stats.totalCredit} color="#16A34A" />
          <StatBox
            label="Balance"
            value={stats.balance}
            color={stats.balance < 0 ? '#DC2626' : '#16A34A'}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const StatBox = ({ label, value, color }) => (
  <View style={styles.statBox}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>₹ {Math.abs(value)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#111827',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  meta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: 11,
    color: '#6B7280',
  },

  statValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },

  empty: {
    alignItems: 'center',
    marginTop: 100,
  },

  emptyText: {
    marginTop: 10,
    color: '#6B7280',
    fontSize: 14,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  /* ===================== SKELETON STYLES ===================== */

  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },

  skeletonImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    marginRight: 12,
  },

  skeletonLineLg: {
    height: 14,
    width: '60%',
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },

  skeletonLineMd: {
    height: 12,
    width: '45%',
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginBottom: 6,
  },

  skeletonLineSm: {
    height: 10,
    width: '35%',
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },

  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: -150,
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
