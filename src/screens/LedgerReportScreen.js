import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
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
import { getAllAccounts } from '../database/handlers/accountHandlers';
import {
  getAccountLedger,
  addLedgerEntry,
} from '../database/handlers/ledgerHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function LedgerReportScreen({ route, navigation }) {
  const initialAccountId = route?.params?.accountId || null;

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [search, setSearch] = useState('');

  // Add Manual Entry Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState('debit');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      const accs = await getAllAccounts();
      setAccounts(accs || []);
      if (accs && accs.length > 0) {
        const defaultAcc = initialAccountId
          ? accs.find((a) => a.id === initialAccountId) || accs[0]
          : accs[0];
        setSelectedAccountId(defaultAcc.id);
        setSelectedAccount(defaultAcc);
      }
    } catch (err) {
      console.warn('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [initialAccountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const loadLedger = useCallback(async (accId) => {
    if (!accId) return;
    try {
      const entries = await getAccountLedger(accId);
      setLedgerEntries(entries || []);
    } catch (err) {
      console.warn('Failed to load ledger for account:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadLedger(selectedAccountId);
      const acc = accounts.find((a) => a.id === selectedAccountId);
      if (acc) setSelectedAccount(acc);
    }
  }, [selectedAccountId, accounts, loadLedger]);

  const accountOptions = useMemo(
    () =>
      accounts.map((a) => ({
        label: `${a.accountName} (${a.accountType} • ₹${a.closingBalance || 0} ${a.closingBalanceType || 'DR'})`,
        value: a.id,
      })),
    [accounts]
  );

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter((e) => {
      return (
        e.narration?.toLowerCase().includes(search.toLowerCase()) ||
        e.referenceType?.toLowerCase().includes(search.toLowerCase()) ||
        String(e.referenceId || '').includes(search)
      );
    });
  }, [ledgerEntries, search]);

  const totals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    ledgerEntries.forEach((e) => {
      if (e.entryType === 'debit') debits += Number(e.amount || 0);
      else if (e.entryType === 'credit') credits += Number(e.amount || 0);
    });
    return { debits, credits };
  }, [ledgerEntries]);

  const handleAddManualEntry = async () => {
    if (!amount || Number(amount) <= 0) {
      showErrorToast('Validation Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addLedgerEntry({
        accountId: selectedAccountId,
        clientId: selectedAccount?.clientId || null,
        entryType,
        amount: parseFloat(amount),
        referenceType: 'Adjustment(Manual)',
        narration: narration || 'Manual Adjustment',
      });
      showSuccessToast('Entry Added', `₹${amount} recorded on ledger`);
      setModalVisible(false);
      setAmount('');
      setNarration('');
      loadAccounts();
      loadLedger(selectedAccountId);
    } catch (err) {
      showErrorToast('Error', err.message);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  const renderEntryItem = ({ item }) => {
    const isDebit = item.entryType === 'debit';
    const isOpening = item.entryType === 'opening';

    return (
      <View style={styles.entryRow}>
        <View style={styles.entryLeft}>
          <Text style={styles.entryDate}>
            {new Date(item.date || item.createdAt).toLocaleDateString('en-IN')}
          </Text>
          <Text style={styles.entryNarration} numberOfLines={2}>
            {item.narration || item.referenceType}
          </Text>
          <View style={styles.refPill}>
            <Text style={styles.refPillText}>
              {item.referenceType} {item.referenceId ? `#${item.referenceId}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.entryRight}>
          <View style={styles.amountCol}>
            {isDebit ? (
              <Text style={styles.debitAmount}>{formatCurrency(item.amount)}</Text>
            ) : !isOpening ? (
              <Text style={styles.creditAmount}>{formatCurrency(item.amount)}</Text>
            ) : (
              <Text style={styles.openingAmount}>{formatCurrency(item.amount)}</Text>
            )}
            <Text style={styles.typeLabel}>
              {isOpening ? 'OPENING' : isDebit ? 'DR (DEBIT)' : 'CR (CREDIT)'}
            </Text>
          </View>

          <View style={styles.balanceBadge}>
            <Text style={styles.balanceText}>
              {formatCurrency(item.balanceAfter)}{' '}
              <Text style={styles.balanceTypeText}>{item.balanceType || 'DR'}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="General Ledger"
        subtitle={selectedAccount ? selectedAccount.accountName : 'Accounts Ledger'}
        rightActions={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#16161b" />
            <Text style={styles.addBtnText}>Add Entry</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Account Selector */}
        <CustomSelect
          label="Select Ledger Account"
          value={selectedAccountId}
          items={accountOptions}
          onValueChange={(val) => setSelectedAccountId(val)}
        />

        {/* Account Summary Banner */}
        {selectedAccount ? (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryTitle}>{selectedAccount.accountName}</Text>
                <Text style={styles.summaryType}>{selectedAccount.accountType} Account</Text>
              </View>
              <View style={styles.closingBadge}>
                <Text style={styles.closingLabel}>CLOSING BALANCE</Text>
                <Text style={styles.closingValue}>
                  {formatCurrency(selectedAccount.closingBalance)}{' '}
                  <Text style={styles.closingType}>{selectedAccount.closingBalanceType || 'DR'}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.summaryStats}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Opening</Text>
                <Text style={styles.statNum}>{formatCurrency(selectedAccount.openingBalance)}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Debits</Text>
                <Text style={[styles.statNum, { color: '#4ade80' }]}>
                  {formatCurrency(totals.debits)}
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Credits</Text>
                <Text style={[styles.statNum, { color: '#f43f5e' }]}>
                  {formatCurrency(totals.credits)}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Filter ledger entries..."
        />

        {loading ? (
          <Loader message="Loading Ledger..." />
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEntryItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="book-open-outline"
                title="No Ledger Records"
                description="No debit/credit transactions have been posted to this account yet."
                actionLabel="Add Manual Entry"
                onAction={() => setModalVisible(true)}
              />
            }
          />
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Ledger Entry</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.targetAccount}>
                Posting to: <Text style={{ color: '#daf4aa' }}>{selectedAccount?.accountName}</Text>
              </Text>

              <View style={styles.typeTabs}>
                <TouchableOpacity
                  style={[styles.typeTab, entryType === 'debit' ? styles.typeTabDebitActive : null]}
                  onPress={() => setEntryType('debit')}
                >
                  <Text style={[styles.typeTabText, entryType === 'debit' ? styles.typeTextActive : null]}>
                    DEBIT (DR)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeTab, entryType === 'credit' ? styles.typeTabCreditActive : null]}
                  onPress={() => setEntryType('credit')}
                >
                  <Text style={[styles.typeTabText, entryType === 'credit' ? styles.typeTextActive : null]}>
                    CREDIT (CR)
                  </Text>
                </TouchableOpacity>
              </View>

              <CustomInput
                label="Entry Amount (₹) *"
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                icon="currency-inr"
              />

              <CustomInput
                label="Narration / Purpose *"
                placeholder="e.g. Bank charges, opening correction..."
                value={narration}
                onChangeText={setNarration}
                multiline
                numberOfLines={2}
              />

              <CustomButton
                title="Save & Update Ledger"
                onPress={handleAddManualEntry}
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
  summaryCard: {
    marginVertical: 4,
    backgroundColor: '#1e1f29',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryType: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  closingBadge: {
    alignItems: 'flex-end',
  },
  closingLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closingValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  closingType: {
    color: '#daf4aa',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statNum: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  entryRow: {
    backgroundColor: '#1c1c24',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryLeft: {
    flex: 1,
    paddingRight: 10,
  },
  entryDate: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  entryNarration: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  refPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  refPillText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  entryRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  debitAmount: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '800',
  },
  creditAmount: {
    color: '#f43f5e',
    fontSize: 14,
    fontWeight: '800',
  },
  openingAmount: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
  },
  typeLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  balanceBadge: {
    marginTop: 6,
  },
  balanceText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  balanceTypeText: {
    color: '#daf4aa',
    fontWeight: '700',
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
  targetAccount: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 14,
  },
  typeTabs: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#1b1b22',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typeTabDebitActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderColor: '#4ade80',
  },
  typeTabCreditActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#f43f5e',
  },
  typeTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  typeTextActive: {
    color: '#ffffff',
  },
});
