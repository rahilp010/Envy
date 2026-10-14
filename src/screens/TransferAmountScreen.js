import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import Card from '../components/common/Card';
import {
  CustomInput,
  CustomButton,
  CustomSelect,
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import { getAllAccounts } from '../database/handlers/accountHandlers';
import { transferAmount } from '../database/handlers/transferHandlers';
import { getTransferHistory } from '../database/handlers/reportHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TransferAmountScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [fromAccountId, setFromAccountId] = useState(null);
  const [toAccountId, setToAccountId] = useState(null);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [history, setHistory] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [allAccs, hist] = await Promise.all([
        getAllAccounts(),
        getTransferHistory(),
      ]);
      const liquidAccs = (allAccs || []).filter((a) =>
        ['Bank', 'Cash', 'GPay'].includes(a.accountType)
      );
      setAccounts(liquidAccs);
      if (liquidAccs.length >= 2) {
        setFromAccountId((prev) => prev || liquidAccs[0].id);
        setToAccountId((prev) => prev || liquidAccs[1].id);
      }
      setHistory(hist || []);
    } catch (err) {
      console.warn('Transfer data fetch error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fromOptions = useMemo(
    () =>
      accounts.map((a) => ({
        label: `${a.accountName} (Bal: ₹${a.closingBalance || 0})`,
        value: a.id,
      })),
    [accounts]
  );

  const toOptions = useMemo(
    () =>
      accounts
        .filter((a) => a.id !== fromAccountId)
        .map((a) => ({
          label: `${a.accountName} (Bal: ₹${a.closingBalance || 0})`,
          value: a.id,
        })),
    [accounts, fromAccountId]
  );

  const fromAccount = useMemo(
    () => accounts.find((a) => a.id === fromAccountId),
    [accounts, fromAccountId]
  );

  const toAccount = useMemo(
    () => accounts.find((a) => a.id === toAccountId),
    [accounts, toAccountId]
  );

  const handleTransfer = async () => {
    const amt = parseFloat(amount);
    if (!fromAccountId || !toAccountId) {
      showErrorToast('Error', 'Please select both source and destination accounts');
      return;
    }
    if (fromAccountId === toAccountId) {
      showErrorToast('Error', 'Source and destination accounts must be different');
      return;
    }
    if (!amt || amt <= 0) {
      showErrorToast('Error', 'Please enter a valid transfer amount');
      return;
    }
    if (Number(fromAccount?.closingBalance || 0) < amt) {
      showErrorToast('Insufficient Balance', `Account only has ₹${fromAccount?.closingBalance || 0}`);
      return;
    }

    setLoading(true);
    try {
      const res = await transferAmount({
        fromAccountId,
        toAccountId,
        amount: amt,
        narration: narration || `Transfer from ${fromAccount.accountName} to ${toAccount.accountName}`,
      });

      if (res.success) {
        showSuccessToast('Transfer Completed', `₹${amt} transferred successfully`);
        setAmount('');
        setNarration('');
        loadData();
      } else {
        showErrorToast('Transfer Failed', res.error || 'Failed to process transfer');
      }
    } catch (err) {
      showErrorToast('Error', err.message);
    } finally {
      setLoading(false);
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
        title="Inter-Account Transfer"
        subtitle="Move funds between treasury accounts"
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Transfer Form Card */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Transfer Funds</Text>
          <Text style={styles.formSub}>
            Both accounts will be updated instantly and double-entry ledger records created.
          </Text>

          <CustomSelect
            label="From Source Account (Debit Outflow) *"
            value={fromAccountId}
            items={fromOptions}
            onValueChange={(val) => {
              setFromAccountId(val);
              if (val === toAccountId) {
                const other = accounts.find((a) => a.id !== val);
                if (other) setToAccountId(other.id);
              }
            }}
          />

          <View style={styles.arrowRow}>
            <View style={styles.arrowLine} />
            <View style={styles.arrowCircle}>
              <MaterialCommunityIcons name="arrow-down" size={20} color="#daf4aa" />
            </View>
            <View style={styles.arrowLine} />
          </View>

          <CustomSelect
            label="To Destination Account (Credit Inflow) *"
            value={toAccountId}
            items={toOptions}
            onValueChange={setToAccountId}
          />

          <CustomInput
            label="Transfer Amount (₹) *"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            icon="currency-inr"
          />

          {fromAccount ? (
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceInfoText}>
                Available in {fromAccount.accountName}:{' '}
                <Text style={{ color: '#4ade80', fontWeight: '800' }}>
                  {formatCurrency(fromAccount.closingBalance)}
                </Text>
              </Text>
            </View>
          ) : null}

          <CustomInput
            label="Transfer Narration / Reference"
            placeholder="e.g. Branch transfer, cash withdrawal..."
            value={narration}
            onChangeText={setNarration}
          />

          <CustomButton
            title="Execute Fund Transfer"
            onPress={handleTransfer}
            loading={loading}
            style={{ marginTop: 14 }}
          />
        </Card>

        {/* Transfer History */}
        <Text style={styles.sectionTitle}>Recent Transfer History</Text>
        {history.length > 0 ? (
          history.map((h, idx) => (
            <Card key={idx} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <MaterialCommunityIcons name="swap-horizontal" size={20} color="#38bdf8" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyNarration}>{h.narration || 'Fund Transfer'}</Text>
                  <Text style={styles.historyDate}>
                    {new Date(h.date || h.createdAt).toLocaleDateString('en-IN')} • Ref #{h.referenceId}
                  </Text>
                </View>
                <Text style={styles.historyAmount}>{formatCurrency(h.amount)}</Text>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transfer history found</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161b',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    padding: 18,
    marginVertical: 4,
  },
  formTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  formSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  arrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.25)',
  },
  balanceInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  balanceInfoText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  historyCard: {
    marginVertical: 3,
    padding: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyNarration: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  historyAmount: {
    color: '#daf4aa',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
  },
});
