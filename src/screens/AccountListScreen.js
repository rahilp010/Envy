import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
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
import {
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../database/handlers/accountHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCOUNT_TYPES = [
  { label: 'Bank Account', value: 'Bank' },
  { label: 'Cash Account', value: 'Cash' },
  { label: 'Google Pay (UPI)', value: 'GPay' },
];

export default function AccountListScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    accountName: '',
    accountType: 'Bank',
    openingBalance: '0',
    accountNumber: '',
  });

  const loadAccounts = useCallback(async () => {
    try {
      const allAccs = await getAllAccounts();
      const liquidAccs = (allAccs || []).filter((a) =>
        ['Bank', 'Cash', 'GPay'].includes(a.accountType)
      );
      setAccounts(liquidAccs);
    } catch (err) {
      console.warn('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const filtered = useMemo(() => {
    return accounts.filter(
      (a) =>
        a.accountName?.toLowerCase().includes(search.toLowerCase()) ||
        a.accountNumber?.includes(search)
    );
  }, [accounts, search]);

  const openAddModal = () => {
    setEditingAccount(null);
    setFormData({
      accountName: '',
      accountType: 'Bank',
      openingBalance: '0',
      accountNumber: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setFormData({
      accountName: acc.accountName,
      accountType: acc.accountType,
      openingBalance: String(acc.openingBalance || 0),
      accountNumber: acc.accountNumber || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.accountName.trim()) {
      showErrorToast('Validation Error', 'Account name is required');
      return;
    }

    try {
      if (editingAccount) {
        await updateAccount({
          id: editingAccount.id,
          accountName: formData.accountName.trim(),
          accountType: formData.accountType,
          accountNumber: formData.accountNumber.trim(),
        });
        showSuccessToast('Account Updated', `"${formData.accountName}" saved`);
      } else {
        await createAccount({
          accountName: formData.accountName.trim(),
          accountType: formData.accountType,
          openingBalance: parseFloat(formData.openingBalance) || 0,
          accountNumber: formData.accountNumber.trim(),
          accounterType: formData.accountType === 'GPay' ? 'GPay' : 'Main',
        });
        showSuccessToast('Account Created', `"${formData.accountName}" added`);
      }
      setModalVisible(false);
      loadAccounts();
    } catch (err) {
      showErrorToast('Save Error', err.message);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Account',
      `Delete "${name}"? Linked ledger transactions will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(id);
              showSuccessToast('Deleted', `Account "${name}" removed`);
              loadAccounts();
            } catch (err) {
              showErrorToast('Delete Error', err.message);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Bank Accounts"
        subtitle={`${accounts.length} active liquidity accounts`}
        rightActions={
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <MaterialCommunityIcons name="plus" size={20} color="#16161b" />
            <Text style={styles.addBtnText}>New Account</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search bank name or account number..."
        />

        {loading ? (
          <Loader message="Loading Accounts..." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card
                style={styles.accCard}
                title={item.accountName}
                subtitle={item.accountNumber ? `A/C No: ${item.accountNumber}` : `${item.accountType} Account`}
                badge={item.accountType}
                badgeColor={
                  item.accountType === 'Bank'
                    ? 'rgba(96, 165, 250, 0.15)'
                    : item.accountType === 'Cash'
                    ? 'rgba(74, 222, 128, 0.15)'
                    : 'rgba(192, 132, 252, 0.15)'
                }
                badgeTextColor={
                  item.accountType === 'Bank'
                    ? '#60a5fa'
                    : item.accountType === 'Cash'
                    ? '#4ade80'
                    : '#c084fc'
                }
                icon={
                  <MaterialCommunityIcons
                    name={
                      item.accountType === 'Bank'
                        ? 'bank'
                        : item.accountType === 'Cash'
                        ? 'cash'
                        : 'google'
                    }
                    size={20}
                    color="#daf4aa"
                  />
                }
                rightAction={
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={styles.actionBtn}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.accountName)}
                      style={styles.actionBtn}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                }
              >
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Opening Balance</Text>
                    <Text style={styles.metricValue}>{formatCurrency(item.openingBalance)}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Closing Balance</Text>
                    <Text style={[styles.metricValue, { color: '#4ade80' }]}>
                      {formatCurrency(item.closingBalance)}
                    </Text>
                  </View>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="bank-outline"
                title="No Bank Accounts"
                description="Add your first bank, cash, or UPI account to record transactions."
                actionLabel="Create Account"
                onAction={openAddModal}
              />
            }
          />
        )}
      </View>

      {/* Add / Edit Account Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Edit Account' : 'Create Bank / Cash Account'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <CustomInput
                label="Account Name *"
                placeholder="e.g. HDFC Main Current A/C"
                value={formData.accountName}
                onChangeText={(val) => setFormData({ ...formData, accountName: val })}
                icon="bank"
              />

              <CustomSelect
                label="Account Classification *"
                value={formData.accountType}
                items={ACCOUNT_TYPES}
                onValueChange={(val) => setFormData({ ...formData, accountType: val })}
              />

              <CustomInput
                label="Account / Cheque Number"
                placeholder="e.g. 50200012345678"
                value={formData.accountNumber}
                onChangeText={(val) => setFormData({ ...formData, accountNumber: val })}
                icon="numeric"
              />

              {!editingAccount ? (
                <CustomInput
                  label="Opening Balance (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.openingBalance}
                  onChangeText={(val) => setFormData({ ...formData, openingBalance: val })}
                  icon="currency-inr"
                />
              ) : null}

              <CustomButton
                title={editingAccount ? 'Update Account' : 'Create Account'}
                onPress={handleSave}
                style={{ marginTop: 14, marginBottom: 20 }}
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
  listContent: {
    paddingBottom: 24,
  },
  accCard: {
    marginVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
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
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 14,
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
  modalForm: {
    maxHeight: 450,
  },
});
