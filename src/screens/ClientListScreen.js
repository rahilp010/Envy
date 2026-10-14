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
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import {
  CustomInput,
  CustomButton,
  CustomSelect,
  CustomToggle,
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import {
  getAllClients,
  createClient,
  updateClient,
  deleteClient,
} from '../database/handlers/clientHandlers';
import {
  setClients,
  createClient as createClientAction,
  updateClient as updateClientAction,
  deleteClient as deleteClientAction,
} from '../app/features/envySlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ACCOUNT_TYPES = [
  { label: 'Debtor (Customer)', value: 'Debtor' },
  { label: 'Creditor (Supplier)', value: 'Creditor' },
];

export default function ClientListScreen({ navigation }) {
  const dispatch = useDispatch();
  const reduxClients = useSelector((state) => state.envy.clients.data);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    phoneNo: '',
    gstNo: '',
    address: '',
    accountType: 'Debtor',
    openingBalance: '0',
    pendingAmount: '0',
    pendingFromOurs: '0',
    isEmployee: false,
    salary: '0',
  });

  const loadClients = useCallback(async () => {
    try {
      const data = await getAllClients();
      dispatch(setClients(data || []));
    } catch (err) {
      console.warn('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  const filteredClients = useMemo(() => {
    return reduxClients.filter((c) => {
      const matchesSearch =
        c.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        c.phoneNo?.toLowerCase().includes(search.toLowerCase()) ||
        c.gstNo?.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        selectedTypeFilter === 'ALL'
          ? true
          : selectedTypeFilter === 'EMPLOYEE'
          ? Boolean(c.isEmployee)
          : c.accountType === selectedTypeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [reduxClients, search, selectedTypeFilter]);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      clientName: '',
      phoneNo: '',
      gstNo: '',
      address: '',
      accountType: 'Debtor',
      openingBalance: '0',
      pendingAmount: '0',
      pendingFromOurs: '0',
      isEmployee: false,
      salary: '0',
    });
    setModalVisible(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      clientName: client.clientName || '',
      phoneNo: client.phoneNo || '',
      gstNo: client.gstNo || '',
      address: client.address || '',
      accountType: client.accountType || 'Debtor',
      openingBalance: String(client.openingBalance || 0),
      pendingAmount: String(client.pendingAmount || 0),
      pendingFromOurs: String(client.pendingFromOurs || 0),
      isEmployee: Boolean(client.isEmployee),
      salary: String(client.salary || 0),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.clientName.trim()) {
      showErrorToast('Validation Error', 'Client name is required');
      return;
    }

    try {
      if (editingClient) {
        const payload = {
          ...editingClient,
          clientName: formData.clientName.trim(),
          phoneNo: formData.phoneNo.trim(),
          gstNo: formData.gstNo.trim(),
          address: formData.address.trim(),
          accountType: formData.accountType,
          pendingAmount: parseFloat(formData.pendingAmount) || 0,
          pendingFromOurs: parseFloat(formData.pendingFromOurs) || 0,
          isEmployee: formData.isEmployee ? 1 : 0,
          salary: parseFloat(formData.salary) || 0,
        };
        const updated = await updateClient(payload);
        dispatch(updateClientAction(updated || payload));
        showSuccessToast('Client Updated', `"${payload.clientName}" saved`);
      } else {
        const payload = {
          clientName: formData.clientName.trim(),
          phoneNo: formData.phoneNo.trim(),
          gstNo: formData.gstNo.trim(),
          address: formData.address.trim(),
          accountType: formData.accountType,
          openingBalance: parseFloat(formData.openingBalance) || 0,
          pendingAmount: parseFloat(formData.pendingAmount) || 0,
          pendingFromOurs: parseFloat(formData.pendingFromOurs) || 0,
          isEmployee: formData.isEmployee ? 1 : 0,
          salary: parseFloat(formData.salary) || 0,
          createdAt: new Date().toISOString(),
        };
        const res = await createClient(payload);
        dispatch(createClientAction({ ...payload, id: res.clientId, accountId: res.accountId }));
        showSuccessToast('Client Added', `"${payload.clientName}" created with account`);
      }
      setModalVisible(false);
      loadClients();
    } catch (err) {
      showErrorToast('Save Error', err.message);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Client Account',
      `Delete "${name}" and all associated balances?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(id);
              dispatch(deleteClientAction(id));
              showSuccessToast('Deleted', `Client "${name}" removed`);
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

  const renderClientItem = ({ item }) => {
    const isCreditor = item.accountType === 'Creditor';

    return (
      <Card
        style={styles.clientCard}
        title={item.clientName}
        subtitle={item.phoneNo ? `Phone: ${item.phoneNo}` : item.address || 'No contact added'}
        badge={item.isEmployee ? 'EMPLOYEE' : isCreditor ? 'CREDITOR' : 'DEBTOR'}
        badgeColor={
          item.isEmployee
            ? 'rgba(192, 132, 252, 0.15)'
            : isCreditor
            ? 'rgba(251, 146, 60, 0.15)'
            : 'rgba(56, 189, 248, 0.15)'
        }
        badgeTextColor={
          item.isEmployee ? '#c084fc' : isCreditor ? '#fb923c' : '#38bdf8'
        }
        icon={
          <MaterialCommunityIcons
            name={item.isEmployee ? 'badge-account-outline' : 'account-circle-outline'}
            size={22}
            color="#a78bfa"
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
              onPress={() => handleDelete(item.id, item.clientName)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.cardMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Pending (To Receive)</Text>
            <Text style={[styles.metricValue, styles.pendingAmount]}>
              {formatCurrency(item.pendingAmount)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Our Pendings (To Pay)</Text>
            <Text style={[styles.metricValue, styles.ourPending]}>
              {formatCurrency(item.pendingFromOurs)}
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Paid</Text>
            <Text style={styles.metricValue}>{formatCurrency(item.paidAmount)}</Text>
          </View>
        </View>

        {item.gstNo ? (
          <View style={styles.gstBadgeRow}>
            <Text style={styles.gstText}>GSTIN: {item.gstNo}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Clients & Parties"
        subtitle={`${filteredClients.length} accounts`}
        rightActions={
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <MaterialCommunityIcons name="plus" size={20} color="#16161b" />
            <Text style={styles.addBtnText}>Add Client</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search client name, phone, or GSTIN..."
        />

        {/* Filter Pills */}
        <View style={styles.filterBar}>
          {['ALL', 'Debtor', 'Creditor', 'EMPLOYEE'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                selectedTypeFilter === filter ? styles.filterPillActive : null,
              ]}
              onPress={() => setSelectedTypeFilter(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedTypeFilter === filter ? styles.filterPillTextActive : null,
                ]}
              >
                {filter === 'Debtor'
                  ? 'Debtors'
                  : filter === 'Creditor'
                  ? 'Creditors'
                  : filter === 'EMPLOYEE'
                  ? 'Employees'
                  : 'All Parties'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Loader message="Loading Client Accounts..." />
        ) : (
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderClientItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="account-off-outline"
                title="No Clients Found"
                description={
                  search
                    ? `No parties match "${search}"`
                    : 'Add clients and parties to begin recording sales, purchases, and ledger transactions'
                }
                actionLabel="Create Client Account"
                onAction={openAddModal}
              />
            }
          />
        )}
      </View>

      {/* Add / Edit Client Modal */}
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
                {editingClient ? 'Edit Client Account' : 'Add New Client'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <CustomInput
                label="Client / Party Name *"
                placeholder="e.g. Ramesh Trading Co."
                value={formData.clientName}
                onChangeText={(val) => setFormData({ ...formData, clientName: val })}
                icon="account-outline"
              />

              <View style={styles.modalRow}>
                <CustomInput
                  style={{ flex: 1, marginRight: 8 }}
                  label="Contact Phone"
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={formData.phoneNo}
                  onChangeText={(val) => setFormData({ ...formData, phoneNo: val })}
                  icon="phone-outline"
                />

                <CustomInput
                  style={{ flex: 1, marginLeft: 8 }}
                  label="GSTIN Number"
                  placeholder="e.g. 24AAAPA..."
                  value={formData.gstNo}
                  onChangeText={(val) => setFormData({ ...formData, gstNo: val })}
                />
              </View>

              <CustomSelect
                label="Account Classification *"
                value={formData.accountType}
                items={ACCOUNT_TYPES}
                onValueChange={(val) => setFormData({ ...formData, accountType: val })}
              />

              <CustomInput
                label="Billing / Shipping Address"
                placeholder="Full address details"
                multiline
                numberOfLines={2}
                value={formData.address}
                onChangeText={(val) => setFormData({ ...formData, address: val })}
                icon="map-marker-outline"
              />

              {!editingClient ? (
                <CustomInput
                  label="Opening Balance (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.openingBalance}
                  onChangeText={(val) => setFormData({ ...formData, openingBalance: val })}
                  icon="currency-inr"
                />
              ) : null}

              <CustomToggle
                label="Is Employee Account?"
                subtitle="Enable for staff payroll and salary tracking"
                value={formData.isEmployee}
                onValueChange={(val) => setFormData({ ...formData, isEmployee: val })}
              />

              {formData.isEmployee ? (
                <CustomInput
                  label="Monthly Base Salary (₹)"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.salary}
                  onChangeText={(val) => setFormData({ ...formData, salary: val })}
                  icon="cash-multiple"
                />
              ) : null}

              <CustomButton
                title={editingClient ? 'Update Client' : 'Create Client Account'}
                onPress={handleSave}
                style={{ marginTop: 12, marginBottom: 20 }}
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
    flexWrap: 'wrap',
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
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  clientCard: {
    marginVertical: 5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  cardMetrics: {
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
    fontWeight: '600',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  pendingAmount: {
    color: '#4ade80',
  },
  ourPending: {
    color: '#f43f5e',
  },
  gstBadgeRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  gstText: {
    color: '#94a3b8',
    fontSize: 11,
    letterSpacing: 0.5,
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
    maxHeight: 500,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
