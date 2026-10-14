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
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import {
  getAllPurchases,
  createPurchase,
  deletePurchase,
} from '../database/handlers/purchaseHandlers';
import { getAllClients } from '../database/handlers/clientHandlers';
import { getAllProducts } from '../database/handlers/productHandlers';
import { generatePurchaseBillNo } from '../database/handlers/billUtils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PurchaseScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [purchaseList, setPurchaseList] = useState([]);
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
    purchaseAmount: '',
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
      const [purchasesData, clientsData, productsData] = await Promise.all([
        getAllPurchases(),
        getAllClients(),
        getAllProducts(),
      ]);
      setPurchaseList(purchasesData || []);
      setClients(clientsData || []);
      setProducts(productsData || []);
    } catch (err) {
      console.warn('Purchase screen data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Suppliers / Creditors prioritized
  const supplierOptions = useMemo(
    () =>
      clients.map((c) => ({
        label: `${c.clientName} (${c.accountType || 'Creditor'})`,
        value: c.id,
      })),
    [clients]
  );

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        label: `${p.productName} (₹${p.productPrice} • In Stock: ${p.productQuantity})`,
        value: p.id,
      })),
    [products]
  );

  const calculatedTotal = useMemo(() => {
    const base = Number(formData.purchaseAmount) || 0;
    const qty = Number(formData.quantity) || 1;
    const subtotal = base * qty;
    const disc = Number(formData.discount) || 0;
    const freight = Number(formData.freightCharges) || 0;
    return Math.max(0, subtotal - disc + freight);
  }, [formData.purchaseAmount, formData.quantity, formData.discount, formData.freightCharges]);

  const openAddModal = async () => {
    const nextBill = await generatePurchaseBillNo();
    setFormData({
      clientId: clients[0]?.id || null,
      productId: products[0]?.id || null,
      quantity: '1',
      purchaseAmount: products[0]?.productPrice ? String(products[0].productPrice) : '0',
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
      purchaseAmount: selected ? String(selected.productPrice) : prev.purchaseAmount,
    }));
  };

  const handleSavePurchase = async () => {
    if (!formData.clientId) {
      showErrorToast('Validation Error', 'Please select a supplier');
      return;
    }

    try {
      const payload = {
        clientId: formData.clientId,
        productId: formData.productId,
        quantity: parseInt(formData.quantity, 10) || 1,
        purchaseAmount: parseFloat(formData.purchaseAmount) || 0,
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

      await createPurchase(payload);
      showSuccessToast('Purchase Recorded', `Bill ${payload.billNo} generated & stock incremented`);
      setModalVisible(false);
      loadData();
    } catch (err) {
      showErrorToast('Error', err.message);
    }
  };

  const handleDeletePurchase = (purchaseId, billNo) => {
    Alert.alert(
      'Delete Purchase Bill',
      `Delete ${billNo}? Added stock and supplier liabilities will be rolled back.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePurchase(purchaseId);
              showSuccessToast('Bill Deleted', `${billNo} removed and stock reversed`);
              loadData();
            } catch (err) {
              showErrorToast('Delete Error', err.message);
            }
          },
        },
      ]
    );
  };

  const filteredPurchases = useMemo(() => {
    return purchaseList.filter((p) => {
      const matchesSearch =
        p.billNo?.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        p.productName?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || p.statusOfTransaction === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchaseList, search, statusFilter]);

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  const renderPurchaseItem = ({ item }) => {
    const isCompleted = item.statusOfTransaction === 'completed';
    const isPartial = item.statusOfTransaction === 'partial';

    return (
      <Card
        style={styles.purchaseCard}
        title={item.billNo || 'PURCHASE BILL'}
        subtitle={item.clientName ? `Supplier: ${item.clientName}` : 'No Supplier'}
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
          <MaterialCommunityIcons name="cart-arrow-down" size={20} color="#f472b6" />
        }
        rightAction={
          <TouchableOpacity
            onPress={() => handleDeletePurchase(item.id, item.billNo)}
            style={styles.actionBtn}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
          </TouchableOpacity>
        }
      >
        <View style={styles.cardInfo}>
          <Text style={styles.productText}>
            {item.productName || 'Inventory Stock In'} ({item.quantity} units)
          </Text>
          <Text style={styles.methodText}>
            Mode: {item.paymentMethod?.toUpperCase()}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Bill</Text>
            <Text style={styles.metricValue}>{formatCurrency(item.totalAmountWithTax)}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Paid</Text>
            <Text style={[styles.metricValue, { color: '#4ade80' }]}>
              {formatCurrency(item.paidAmount)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>To Pay</Text>
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
        title="Purchase Bills"
        subtitle={`${filteredPurchases.length} bills recorded`}
        rightActions={
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <MaterialCommunityIcons name="plus" size={20} color="#16161b" />
            <Text style={styles.addBtnText}>New Purchase</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by Bill No, Supplier, or Product..."
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
          <Loader message="Loading Purchase Invoices..." />
        ) : (
          <FlatList
            data={filteredPurchases}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPurchaseItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="cart-plus"
                title="No Purchases Recorded"
                description={
                  search
                    ? `No bills match "${search}"`
                    : 'Record purchases to increment inventory stock and track accounts payable'
                }
                actionLabel="Record First Purchase"
                onAction={openAddModal}
              />
            }
          />
        )}
      </View>

      {/* New Purchase Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record New Purchase</Text>
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
                label="Select Supplier / Creditor *"
                value={formData.clientId}
                items={supplierOptions}
                onValueChange={(val) => setFormData({ ...formData, clientId: val })}
              />

              <CustomSelect
                label="Select Product to Restock *"
                value={formData.productId}
                items={productOptions}
                onValueChange={handleProductSelect}
              />

              <View style={styles.modalRow}>
                <CustomInput
                  style={{ flex: 1, marginRight: 8 }}
                  label="Purchase Unit Price (₹) *"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.purchaseAmount}
                  onChangeText={(val) => setFormData({ ...formData, purchaseAmount: val })}
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
                  label="Supplier Discount (₹)"
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
                label="Notes / Supplier Bill Reference"
                placeholder="Optional purchase bill notes"
                value={formData.description}
                onChangeText={(val) => setFormData({ ...formData, description: val })}
                multiline
                numberOfLines={2}
              />

              <CustomButton
                title="Save & Increase Stock"
                onPress={handleSavePurchase}
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
  purchaseCard: {
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
