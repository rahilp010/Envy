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
import EditableTaxInvoiceModal from '../components/modals/EditableTaxInvoiceModal';
import { getAllSales } from '../database/handlers/salesHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SalesInvoiceScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [selectedTx, setSelectedTx] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [studioModalVisible, setStudioModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getAllSales();
      setSales(data || []);
    } catch (err) {
      console.error('Failed to load sales invoices:', err);
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

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.billNo && s.billNo.toLowerCase().includes(q)) ||
      (s.clientName && s.clientName.toLowerCase().includes(q))
    );
  });

  const handleOpenInvoice = (tx) => {
    setSelectedTx(tx);
    setViewModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Sales Invoices"
        subtitle="GST Tax Invoices & Records"
        leftAction="menu"
        rightAction={() => setStudioModalVisible(true)}
        rightIcon="plus"
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Invoice No or Client..."
        />
      </View>

      {loading ? (
        <Loader fullScreen={false} message="Loading tax invoices..." />
      ) : (
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No Invoices Found"
              description="No sales invoices match your search query."
              actionLabel="Create Invoice in Studio"
              onAction={() => setStudioModalVisible(true)}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpenInvoice(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.billPill}>
                  <MaterialCommunityIcons name="receipt-outline" size={14} color="#daf4aa" />
                  <Text style={styles.billNoText}>{item.billNo || 'SAL-NEW'}</Text>
                </View>
                <Text style={styles.dateText}>
                  {item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-'}
                </Text>
              </View>

              <Text style={styles.clientName}>{item.clientName || 'Cash Sale'}</Text>

              <View style={styles.detailsRow}>
                <View>
                  <Text style={styles.subtext}>Total Amount</Text>
                  <Text style={styles.amountText}>
                    ₹{parseFloat(item.totalAmountWithTax || item.saleAmount || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subtext}>Status</Text>
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
                <Text style={styles.viewInvoiceLink}>
                  Tap to preview, print or share on WhatsApp →
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Full-Screen Preview Modal */}
      <SalesInvoiceModal
        visible={viewModalVisible}
        onClose={() => setViewModalVisible(false)}
        transaction={selectedTx}
        client={{ clientName: selectedTx?.clientName, phoneNo: selectedTx?.clientPhone }}
      />

      {/* Invoice Studio Editor Modal */}
      <EditableTaxInvoiceModal
        visible={studioModalVisible}
        onClose={() => setStudioModalVisible(false)}
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
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  billNoText: {
    color: '#daf4aa',
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
    color: '#daf4aa',
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
