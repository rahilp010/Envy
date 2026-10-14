import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import PaymentMethod from '../components/payment/PaymentMethod';
import {
  CustomInput,
  CustomButton,
  CustomSelect,
  CustomToggle,
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import {
  getAllSales,
  createSales,
  deleteSales,
} from '../database/handlers/salesHandlers';
import { getAllClients } from '../database/handlers/clientHandlers';
import { getAllProducts } from '../database/handlers/productHandlers';
import { generateSalesBillNo } from '../database/handlers/billUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TransactionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [salesList, setSalesList] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    clientId: null,
    productId: null,
    quantity: '1',
    saleAmount: '',
    discount: '0',
    freightCharges: '0',
    paymentMethod: 'bank',
    paidAmount: '0',
    selectedAccountId: null,
    billNo: '',
    description: '',
  });

  const loadData = useCallback(async () => {
    try {
      const [salesData, clientsData, productsData] = await Promise.all([
        getAllSales(),
        getAllClients(),
        getAllProducts(),
      ]);
      setSalesList(salesData || []);
      setClients(clientsData || []);
      setProducts(productsData || []);
    } catch (err) {
      console.warn('Sales screen data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const clientOptions = useMemo(
    () =>
      clients.map((c) => ({
        label: `${c.clientName} (${c.accountType || 'Debtor'})`,
        value: c.id,
      })),
    [clients]
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        label: `${p.productName} (₹${p.productPrice} • Qty: ${p.productQuantity})`,
        value: p.id,
      })),
    [products]
  );

  // Auto calculate total
  const calculatedTotal = useMemo(() => {
    const base = Number(formData.saleAmount) || 0;
    const qty = Number(formData.quantity) || 1;
    const subtotal = base * qty;
    const disc = Number(formData.discount) || 0;
    const freight = Number(formData.freightCharges) || 0;
    return Math.max(0, subtotal - disc + freight);
  }, [formData.saleAmount, formData.quantity, formData.discount, formData.freightCharges]);

  const openAddModal = async () => {
    const nextBill = await generateSalesBillNo();
    setFormData({
      clientId: clients[0]?.id || null,
      productId: products[0]?.id || null,
      quantity: '1',
      saleAmount: products[0]?.productPrice ? String(products[0].productPrice) : '0',
      discount: '0',
      freightCharges: '0',
      paymentMethod: 'bank',
      paidAmount: products[0]?.productPrice ? String(products[0].productPrice) : '0',
      selectedAccountId: null,
      billNo: nextBill,
      description: '',
    });
    setModalVisible(true);
  };

  const handleProductSelect = (prodId) => {
    const selected = products.find((p) => p.id === prodId);
    setFormData((prev) => ({
      ...prev,
      productId: prodId,
      saleAmount: selected ? String(selected.productPrice) : prev.saleAmount,
    }));
  };

  const handleSaveSale = async () => {
    if (!formData.clientId) {
      showErrorToast('Validation Error', 'Please select a client');
      return;
    }

    try {
      const payload = {
        clientId: formData.clientId,
        productId: formData.productId,
        quantity: parseInt(formData.quantity, 10) || 1,
        saleAmount: parseFloat(formData.saleAmount) || 0,
        discount: parseFloat(formData.discount) || 0,
        freightCharges: parseFloat(formData.freightCharges) || 0,
        totalAmountWithoutTax: calculatedTotal,
        totalAmountWithTax: calculatedTotal,
        paidAmount: parseFloat(formData.paidAmount) || 0,
        paymentMethod: formData.paymentMethod,
        billNo: formData.billNo,
        description: formData.description,
        payments:
          Number(formData.paidAmount) > 0
            ? [
                {
                  method: formData.paymentMethod,
                  amount: Number(formData.paidAmount),
                  accountId: formData.selectedAccountId,
                },
              ]
            : [],
      };

      await createSales(payload);
      showSuccessToast('Sale Recorded', `Invoice ${payload.billNo} generated successfully`);
      setModalVisible(false);
      loadData();
    } catch (err) {
      showErrorToast('Error', err.message);
    }
  };

  const handleDeleteSale = (saleId, billNo) => {
    Alert.alert(
      'Delete Sales Invoice',
      `Delete ${billNo}? Stock and ledger balances will be reversed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSales(saleId);
              showSuccessToast('Invoice Deleted', `${billNo} removed and reversed`);
              loadData();
            } catch (err) {
              showErrorToast('Delete Error', err.message);
            }
          },
        },
      ]
    );
  };

  const filteredSales = useMemo(() => {
    return salesList.filter((s) => {
      const matchesSearch =
        s.billNo?.toLowerCase().includes(search.toLowerCase()) ||
        s.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        s.productName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || s.statusOfTransaction === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [salesList, search, statusFilter]);

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  const renderSaleItem = ({ item }) => {
    const isCompleted = item.statusOfTransaction === 'completed';
    const isPartial = item.statusOfTransaction === 'partial';

    return (
      <Card
        style={styles.saleCard}
        title={item.billNo || 'INVOICE'}
        subtitle={item.clientName ? `Client: ${item.clientName}` : 'No Client'}
        badge={item.statusOfTransaction?.toUpperCase()}
        badgeColor={
          isCompleted
            ? 'rgba(74, 222, 128, 0.15)'
            : isPartial
            ? 'rgba(251, 191, 36, 0.15)'
            : 'rgba(244, 63, 94, 0.15)'
        }
        badgeTextColor={
          isCompleted ? '#4ade80' : isPartial ? '#fbbf24' : '#f43f5e'
        }
        icon={
          <MaterialCommunityIcons name="cart-arrow-up" size={20} color="#daf4aa" />
        }
        rightAction={
          <TouchableOpacity
            onPress={() => handleDeleteSale(item.id, item.billNo)}
            style={styles.actionBtn}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
          </TouchableOpacity>
        }
      >
        <View style={styles.cardInfo}>
          <Text style={styles.productText}>
            {item.productName || 'Custom Items'} ({item.quantity} units)
          </Text>
          <Text style={styles.methodText}>
            Mode: {item.paymentMethod?.toUpperCase()}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Amount</Text>
            <Text style={styles.metricValue}>{formatCurrency(item.totalAmountWithTax)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Paid</Text>
            <Text style={[styles.metricValue, { color: '#4ade80' }]}>
              {formatCurrency(item.paidAmount)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={[styles.metricValue, { color: '#f43f5e' }]}>
              {formatCurrency(item.pendingAmount)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Sales Transactions"
        subtitle={`${filteredSales.length} invoices recorded`}
        rightActions={
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <MaterialCommunityIcons name="plus" size={20} color="#16161b" />
            <Text style={styles.addBtnText}>New Sale</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Bill No, Client, or Product..."
        />

        {/* Status Filters */}
        <View style={styles.filterBar}>
          {['ALL', 'completed', 'pending', 'partial'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.filterPill,
                statusFilter === st ? styles.filterPillActive : null,
              ]}
              onPress={() => setStatusFilter(st)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  statusFilter === st ? styles.filterPillTextActive : null,
                ]}
              >
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Loader message="Loading Sales..." />
        ) : (
          <FlatList
            data={filteredSales}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderSaleItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="cart-outline"
                title="No Sales Invoices"
                description={
                  search
                    ? `No sales match "${search}"`
                    : 'Create your first sale invoice to record inventory stock out and revenue'
                }
                actionLabel="Create New Sale"
                onAction={openAddModal}
              />
            }
          />
        )}
      </View>

      {/* New Sale Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record New Sale</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <CustomInput
                label="Bill Number (Auto Generated)"
                value={formData.billNo}
                onChangeText={(val) => setFormData({ ...formData, billNo: val })}
                icon="receipt"
              />

              <CustomSelect
                label="Select Client / Party *"
                value={formData.clientId}
                items={clientOptions}
                onValueChange={(val) => setFormData({ ...formData, clientId: val })}
              />

              <CustomSelect
                label="Select Product *"
                value={formData.productId}
                items={productOptions}
                onValueChange={handleProductSelect}
              />

              <View style={styles.modalRow}>
                <CustomInput
                  style={{ flex: 1, marginRight: 8 }}
                  label="Unit Price (₹) *"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.saleAmount}
                  onChangeText={(val) => setFormData({ ...formData, saleAmount: val })}
                  icon="currency-inr"
                />

                <CustomInput
                  style={{ flex: 1, marginLeft: 8 }}
                  label="Quantity *"
                  placeholder="1"
                  keyboardType="numeric"
                  value={formData.quantity}
                  onChangeText={(val) => setFormData({ ...formData, quantity: val })}
                />
              </View>

              <View style={styles.modalRow}>
                <CustomInput
                  style={{ flex: 1, marginRight: 8 }}
                  label="Discount (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.discount}
                  onChangeText={(val) => setFormData({ ...formData, discount: val })}
                />

                <CustomInput
                  style={{ flex: 1, marginLeft: 8 }}
                  label="Freight Charges (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.freightCharges}
                  onChangeText={(val) => setFormData({ ...formData, freightCharges: val })}
                />
              </View>

              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeLabel}>Final Calculated Total:</Text>
                <Text style={styles.totalBadgeValue}>{formatCurrency(calculatedTotal)}</Text>
              </View>

              <PaymentMethod
                selectedMethod={formData.paymentMethod}
                onMethodChange={(method) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentMethod: method,
                    paidAmount: method === 'pending' ? '0' : String(calculatedTotal),
                  }))
                }
                paidAmount={formData.paidAmount}
                onPaidAmountChange={(val) => setFormData((prev) => ({ ...prev, paidAmount: val }))}
                totalAmount={calculatedTotal}
                selectedAccountId={formData.selectedAccountId}
                onAccountChange={(accId) =>
                  setFormData((prev) => ({ ...prev, selectedAccountId: accId }))
                }
              />

              <CustomInput
                label="Notes / Description"
                placeholder="Optional invoice remarks"
                value={formData.description}
                onChangeText={(val) => setFormData({ ...formData, description: val })}
                multiline
                numberOfLines={2}
              />

              <CustomButton
                title="Save & Generate Invoice"
                onPress={handleSaveSale}
                style={{ marginTop: 12, marginBottom: 28 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#16161b',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#20212a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: '#7c3aed',
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingBottom: 24,
  },
  saleCard: {
    marginVertical: 5,
  },
  actionBtn: {
    padding: 6,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  productText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  methodText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1e1f28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalForm: {
    maxHeight: 520,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalBadge: {
    backgroundColor: 'rgba(218, 244, 170, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.25)',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  totalBadgeLabel: {
    color: '#daf4aa',
    fontSize: 13,
    fontWeight: '700',
  },
  totalBadgeValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
