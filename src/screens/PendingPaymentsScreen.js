import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import {
  CustomInput,
  CustomButton,
  CustomSelect,
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import { getPendingPayments } from '../database/handlers/reportHandlers';
import { addPaymentAgainstInvoice } from '../database/handlers/transferHandlers';
import { getAllAccounts } from '../database/handlers/accountHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PendingPaymentsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [search, setSearch] = useState('');

  // Payment Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [narration, setNarration] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [payData, accs] = await Promise.all([
        getPendingPayments(),
        getAllAccounts(),
      ]);
      setPayments(payData || []);
      const liquidAccs = accs.filter((a) => ['Bank', 'Cash', 'GPay'].includes(a.accountType));
      setBankAccounts(liquidAccs || []);
      if (liquidAccs.length > 0) setSelectedBankId(liquidAccs[0].id);
    } catch (err) {
      console.warn('Pending payments fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bankOptions = useMemo(
    () =>
      bankAccounts.map((b) => ({
        label: `${b.accountName} (₹${b.closingBalance || 0})`,
        value: b.id,
      })),
    [bankAccounts]
  );

  const totalOutstanding = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.pendingTotal || 0), 0);
  }, [payments]);

  const filtered = useMemo(() => {
    return payments.filter(
      (p) =>
        p.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        p.phoneNo?.includes(search)
    );
  }, [payments, search]);

  const openPaymentModal = (supplier) => {
    setSelectedSupplier(supplier);
    setPayAmount(String(supplier.pendingTotal || ''));
    setNarration(`Payment made to ${supplier.clientName}`);
    setModalVisible(true);
  };

  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      showErrorToast('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedBankId) {
      showErrorToast('Error', 'Please select a paying account');
      return;
    }

    try {
      await addPaymentAgainstInvoice({
        bankAccountId: selectedBankId,
        clientId: selectedSupplier.id,
        invoiceType: 'Purchase',
        amount: parseFloat(payAmount),
        narration: narration || 'Pending Supplier Payment',
      });
      showSuccessToast('Payment Settled', `₹${payAmount} paid to supplier`);
      setModalVisible(false);
      loadData();
    } catch (err) {
      showErrorToast('Payment Error', err.message);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Pending Payments"
        subtitle={`${payments.length} suppliers to settle`}
      />

      <View style={styles.content}>
        {/* Total Outstanding Banner */}
        <Card style={styles.bannerCard}>
          <Text style={styles.bannerLabel}>TOTAL PENDING LIABILITIES</Text>
          <Text style={styles.bannerValue}>{formatCurrency(totalOutstanding)}</Text>
          <Text style={styles.bannerSub}>Amount to pay to suppliers and creditors</Text>
        </Card>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search supplier name or phone..."
        />

        {loading ? (
          <Loader message="Loading Payables..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card
                style={styles.supplierCard}
                title={item.clientName}
                subtitle={item.phoneNo ? `Phone: ${item.phoneNo}` : 'No phone registered'}
                badge={`${item.pendingBillsCount} BILLS`}
                badgeColor="rgba(251, 146, 60, 0.15)"
                badgeTextColor="#fb923c"
                icon={<MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#fb923c" />}
                rightAction={
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => openPaymentModal(item)}
                  >
                    <MaterialCommunityIcons name="cash-fast" size={16} color="#16161b" />
                    <Text style={styles.payBtnText}>Pay</Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Amount Owed to Supplier:</Text>
                  <Text style={styles.metricValue}>{formatCurrency(item.pendingTotal)}</Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="check-decagram-outline"
                title="All Supplier Bills Settled!"
                description="There are currently no outstanding purchase liabilities to pay."
              />
            }
          />
        )}
      </View>

      {/* Pay Supplier Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settle Supplier Bill</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSupplierName}>
              Supplier: <Text style={{ color: '#daf4aa' }}>{selectedSupplier?.clientName}</Text>
            </Text>

            <CustomSelect
              label="Source Bank/Cash Account *"
              value={selectedBankId}
              items={bankOptions}
              onValueChange={setSelectedBankId}
            />

            <CustomInput
              label="Payment Amount (₹) *"
              placeholder="0.00"
              keyboardType="numeric"
              value={payAmount}
              onChangeText={setPayAmount}
              icon="currency-inr"
            />

            <CustomInput
              label="Payment Narration"
              value={narration}
              onChangeText={setNarration}
              multiline
              numberOfLines={2}
            />

            <CustomButton
              title="Pay Supplier & Clear Bill"
              onPress={handleRecordPayment}
              style={{ marginTop: 14, marginBottom: 20 }}
            />
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
  bannerCard: {
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
    borderColor: 'rgba(251, 146, 60, 0.25)',
    marginVertical: 4,
    padding: 16,
  },
  bannerLabel: {
    color: '#fb923c',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  bannerSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  supplierCard: {
    marginVertical: 4,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payBtnText: {
    color: '#16161b',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  metricValue: {
    color: '#fb923c',
    fontSize: 15,
    fontWeight: '800',
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
    maxHeight: '90%',
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
  modalSupplierName: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 14,
  },
});
