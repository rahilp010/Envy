import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import SalesInvoiceModal from '../components/modals/SalesInvoiceModal';
import { getAllPurchases } from '../database/handlers/purchaseHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PurchaseBillScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');

  const [selectedTx, setSelectedTx] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllPurchases();
      setPurchases(data || []);
    } catch (err) {
      console.error('Failed to load purchase bills:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filtered = purchases.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.billNo && p.billNo.toLowerCase().includes(q)) ||
      (p.clientName && p.clientName.toLowerCase().includes(q))
    );
  });

  const handleOpenBill = (tx) => {
    setSelectedTx(tx);
    setViewModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Purchase Bills"
        subtitle="Supplier Bills & Purchase Records"
        leftAction="menu"
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Bill No or Supplier..."
        />
      </View>

      {loading ? (
        <Loader fullScreen={false} message="Loading purchase bills..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f472b6" />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No Purchase Bills Found"
              description="No supplier purchase bills recorded yet."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpenBill(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.billPill}>
                  <MaterialCommunityIcons name="file-document-outline" size={14} color="#f472b6" />
                  <Text style={styles.billNoText}>{item.billNo || 'PUR-NEW'}</Text>
                </View>
                <Text style={styles.dateText}>
                  {item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-'}
                </Text>
              </View>

              <Text style={styles.clientName}>{item.clientName || 'General Supplier'}</Text>

              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.subtext}>Total Purchase Bill</Text>
                  <Text style={styles.amountText}>
                    ₹{parseFloat(item.totalAmountWithTax || item.purchaseAmount || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subtext}>Payment Status</Text>
                  <View
                    style={[
                      styles.statusPill,
                      item.statusOfTransaction === 'completed'
                        ? styles.statusCompleted
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.statusOfTransaction === 'completed'
                          ? styles.statusTextGreen
                          : styles.statusTextYellow,
                      ]}
                    >
                      {(item.statusOfTransaction || 'completed').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.viewInvoiceLink}>Tap to view supplier bill & breakdown →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <SalesInvoiceModal
        visible={viewModalVisible}
        onClose={() => setViewModalVisible(false)}
        transaction={selectedTx}
        client={{ clientName: selectedTx?.clientName, phoneNo: selectedTx?.clientPhone }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  billNoText: {
    color: '#f472b6',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
  },
  clientName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  subtext: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 2,
  },
  amountText: {
    color: '#f472b6',
    fontSize: 16,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextGreen: {
    color: '#10b981',
  },
  statusTextYellow: {
    color: '#eab308',
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  viewInvoiceLink: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
  },
});
