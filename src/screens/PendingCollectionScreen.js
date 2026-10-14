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
import { getPendingCollections } from '../database/handlers/reportHandlers';
import { addPaymentAgainstInvoice } from '../database/handlers/transferHandlers';
import { getAllAccounts } from '../database/handlers/accountHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PendingCollectionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [search, setSearch] = useState('');

  // Payment Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [narration, setNarration] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [collData, accs] = await Promise.all([
        getPendingCollections(),
        getAllAccounts(),
      ]);
      setCollections(collData || []);
      const liquidAccs = accs.filter((a) => ['Bank', 'Cash', 'GPay'].includes(a.accountType));
      setBankAccounts(liquidAccs || []);
      if (liquidAccs.length > 0) setSelectedBankId(liquidAccs[0].id);
    } catch (err) {
      console.warn('Pending collections fetch error:', err);
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
    return collections.reduce((sum, c) => sum + Number(c.pendingTotal || 0), 0);
  }, [collections]);

  const filtered = useMemo(() => {
    return collections.filter(
      (c) =>
        c.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        c.phoneNo?.includes(search)
    );
  }, [collections, search]);

  const openPaymentModal = (client) => {
    setSelectedClient(client);
    setPayAmount(String(client.pendingTotal || ''));
    setNarration(`Payment received from ${client.clientName}`);
    setModalVisible(true);
  };

  const handleRecordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) {
      showErrorToast('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedBankId) {
      showErrorToast('Error', 'Please select a receiving account');
      return;
    }

    try {
      await addPaymentAgainstInvoice({
        bankAccountId: selectedBankId,
        clientId: selectedClient.id,
        invoiceType: 'Sales',
        amount: parseFloat(payAmount),
        narration: narration || 'Pending Collection Payment',
      });
      showSuccessToast('Payment Received', `₹${payAmount} allocated to outstanding invoices`);
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
        title="Pending Collections"
        subtitle={`${collections.length} debtors with balances`}
      />

      <View style={styles.content}>
        {/* Total Outstanding Banner */}
        <Card style={styles.bannerCard}>
          <Text style={styles.bannerLabel}>TOTAL PENDING RECEIVABLES</Text>
          <Text style={styles.bannerValue}>{formatCurrency(totalOutstanding)}</Text>
          <Text style={styles.bannerSub}>Amount to be collected from debtors</Text>
        </Card>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search debtor client name or phone..."
        />

        {loading ? (
          <Loader message="Loading Collections..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card
                style={styles.clientCard}
                title={item.clientName}
                subtitle={item.phoneNo ? `Phone: ${item.phoneNo}` : 'No phone registered'}
                badge={`${item.pendingInvoicesCount} INVOICES`}
                badgeColor="rgba(244, 63, 94, 0.15)"
                badgeTextColor="#f43f5e"
                icon={<MaterialCommunityIcons name="account-alert-outline" size={20} color="#f43f5e" />}
                rightAction={
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => openPaymentModal(item)}
                  >
                    <MaterialCommunityIcons name="cash-check" size={16} color="#16161b" />
                    <Text style={styles.payBtnText}>Collect</Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Pending Amount to Receive:</Text>
                  <Text style={styles.metricValue}>{formatCurrency(item.pendingTotal)}</Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="check-decagram-outline"
                title="All Collections Clear!"
                description="There are currently no outstanding debtor payments to collect."
              />
            }
          />
        )}
      </View>

      {/* Collect Payment Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Collection</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalClientName}>
              Client: <Text style={{ color: '#daf4aa' }}>{selectedClient?.clientName}</Text>
            </Text>

            <CustomSelect
              label="Receiving Bank/Cash Account *"
              value={selectedBankId}
              items={bankOptions}
              onValueChange={setSelectedBankId}
            />

            <CustomInput
              label="Collection Amount (₹) *"
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
              title="Record Payment & Clear Invoice"
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
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
    marginVertical: 4,
    padding: 16,
  },
  bannerLabel: {
    color: '#f43f5e',
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
  clientCard: {
    marginVertical: 4,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    paddingHorizontal: 10,
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
    color: '#f43f5e',
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
  modalClientName: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 14,
  },
});
