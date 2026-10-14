import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProductHistory } from '../../database/handlers/productHandlers';

export default function ProductHistoryCard({ visible, onClose, product }) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState({ sales: [], purchases: [] });
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    if (visible && product?.id) {
      setLoading(true);
      getProductHistory(product.id)
        .then((res) => setHistory(res || { sales: [], purchases: [] }))
        .finally(() => setLoading(false));
    }
  }, [visible, product]);

  if (!product) return null;

  const currentList = activeTab === 'sales' ? history.sales : history.purchases;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{product.productName}</Text>
            <Text style={styles.subtitle}>Stock History & Transactions</Text>
          </View>
        </View>

        {/* Tab switch */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
            onPress={() => setActiveTab('sales')}
          >
            <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
              Sales ({history.sales?.length || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'purchases' && styles.activeTab]}
            onPress={() => setActiveTab('purchases')}
          >
            <Text style={[styles.tabText, activeTab === 'purchases' && styles.activeTabText]}>
              Purchases ({history.purchases?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#daf4aa" />
          </View>
        ) : (
          <FlatList
            data={currentList}
            keyExtractor={(item, index) => String(item.id || index)}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="history" size={40} color="#475569" />
                <Text style={styles.emptyText}>No {activeTab} history found</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.billNo}>{item.billNo || 'TXN'}</Text>
                  <Text style={styles.itemDate}>
                    {item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-'}
                  </Text>
                </View>
                <Text style={styles.clientName}>{item.clientName || 'General Party'}</Text>
                <View style={styles.itemDetails}>
                  <Text style={styles.detailText}>Qty: {item.quantity || 1}</Text>
                  <Text style={[styles.amountText, activeTab === 'sales' ? styles.greenAmt : styles.pinkAmt]}>
                    ₹{parseFloat(item.saleAmount || item.purchaseAmount || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    padding: 6,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#161d2d',
    padding: 4,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#daf4aa',
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 14,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: '#161d2d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billNo: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
  },
  itemDate: {
    color: '#64748b',
    fontSize: 11,
  },
  clientName: {
    color: '#94a3b8',
    fontSize: 12,
    marginVertical: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
  },
  greenAmt: {
    color: '#daf4aa',
  },
  pinkAmt: {
    color: '#f472b6',
  },
});
