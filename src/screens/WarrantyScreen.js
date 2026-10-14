import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { getWarrantyRecords } from '../database/handlers/warrantyHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const STATUS_FILTERS = [
  { label: 'ALL', value: 'ALL' },
  { label: 'Urgent (≤60d)', value: 'red', color: '#f43f5e' },
  { label: 'Moderate (2-6m)', value: 'yellow', color: '#eab308' },
  { label: 'Safe (>6m)', value: 'green', color: '#10b981' },
];

export default function WarrantyScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [warranties, setWarranties] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const records = await getWarrantyRecords({
        search,
        filterStatus: selectedFilter,
      });
      setWarranties(records || []);
    } catch (err) {
      console.error('Error loading warranties:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const urgentCount = warranties.filter((w) => w.status === 'red').length;

  const handleWhatsAppCustomer = (item) => {
    const phone = item.clientPhone ? item.clientPhone.replace(/[^0-9]/g, '') : '';
    if (!phone) return;
    const msg = encodeURIComponent(
      `Hello ${item.clientName},\nThis is a friendly reminder regarding the warranty for your product *${item.productName}* purchased under Bill *${item.billNo}*.\nWarranty Status: *${item.remainingText}*.\nPlease contact us if you require service or support.`
    );
    Linking.openURL(`whatsapp://send?phone=91${phone}&text=${msg}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Warranty Tracking"
        subtitle="Customer Service & Expiry Alerts"
        leftAction="menu"
      />

      <View style={styles.topWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Customer, Product or Bill..."
        />

        {/* Filter Badges */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, selectedFilter === f.value && styles.filterChipActive]}
              onPress={() => setSelectedFilter(f.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === f.value && styles.filterTextActive,
                  f.color && selectedFilter === f.value ? { color: f.color } : null,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <Loader fullScreen={false} message="Checking product warranties..." />
      ) : (
        <FlatList
          data={warranties}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No Warranties Found"
              description="No product sales records match the selected warranty criteria."
            />
          }
          renderItem={({ item }) => {
            const isRed = item.status === 'red';
            const isYellow = item.status === 'yellow';
            const badgeColor = isRed ? '#f43f5e' : isYellow ? '#eab308' : '#10b981';

            return (
              <View style={[styles.card, isRed && styles.cardUrgent]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: `${badgeColor}18` }]}>
                    <View style={[styles.statusDot, { backgroundColor: badgeColor }]} />
                    <Text style={[styles.statusLabel, { color: badgeColor }]}>
                      {item.remainingText}
                    </Text>
                  </View>
                  <Text style={styles.billNoText}>{item.billNo}</Text>
                </View>

                <Text style={styles.productTitle}>{item.productName}</Text>
                <Text style={styles.clientTitle}>
                  Client: {item.clientName} {item.clientPhone ? `(${item.clientPhone})` : ''}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Sold: {item.saleDate}</Text>
                  <Text style={styles.metaLabel}>Expires: {item.expiryDate}</Text>
                  <Text style={styles.metaLabel}>{item.warrantyMonths} Mos</Text>
                </View>

                {item.clientPhone ? (
                  <View style={styles.footerRow}>
                    <TouchableOpacity
                      style={styles.notifyBtn}
                      onPress={() => handleWhatsAppCustomer(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={16} color="#10b981" />
                      <Text style={styles.notifyText}>Notify Customer via WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 10,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#161d2d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
    borderColor: '#daf4aa',
  },
  filterText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#daf4aa',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardUrgent: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  billNoText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  productTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  clientTitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  footerRow: {
    marginTop: 10,
  },
  notifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  notifyText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
});
