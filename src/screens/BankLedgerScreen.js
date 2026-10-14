import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import { CustomSelect } from '../components/common/CustomControls';
import { getAllAccounts } from '../database/handlers/accountHandlers';
import { getAccountLedger } from '../database/handlers/ledgerHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function BankLedgerScreen({ route, navigation }) {
  const initialAccountId = route?.params?.accountId || null;

  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL | INFLOW | OUTFLOW

  const loadData = useCallback(async () => {
    try {
      const allAccs = await getAllAccounts();
      const liquidAccs = (allAccs || []).filter((a) =>
        ['Bank', 'Cash', 'GPay'].includes(a.accountType)
      );
      setBankAccounts(liquidAccs);
      if (liquidAccs.length > 0) {
        const defaultAcc = initialAccountId
          ? liquidAccs.find((a) => a.id === initialAccountId) || liquidAccs[0]
          : liquidAccs[0];
        setSelectedAccountId(defaultAcc.id);
        setSelectedAccount(defaultAcc);
      }
    } catch (err) {
      console.warn('Bank ledger accounts fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [initialAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadLedger = useCallback(async (accId) => {
    if (!accId) return;
    try {
      const led = await getAccountLedger(accId);
      setEntries(led || []);
    } catch (err) {
      console.warn('Failed to load bank ledger:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadLedger(selectedAccountId);
      const acc = bankAccounts.find((a) => a.id === selectedAccountId);
      if (acc) setSelectedAccount(acc);
    }
  }, [selectedAccountId, bankAccounts, loadLedger]);

  const accountOptions = useMemo(
    () =>
      bankAccounts.map((b) => ({
        label: `${b.accountName} (${b.accountType} • ₹${b.closingBalance || 0})`,
        value: b.id,
      })),
    [bankAccounts]
  );

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        e.narration?.toLowerCase().includes(search.toLowerCase()) ||
        e.referenceType?.toLowerCase().includes(search.toLowerCase()) ||
        String(e.referenceId || '').includes(search);

      const matchesType =
        filterType === 'ALL'
          ? true
          : filterType === 'INFLOW'
          ? e.entryType === 'debit'
          : e.entryType === 'credit';

      return matchesSearch && matchesType;
    });
  }, [entries, search, filterType]);

  const stats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    entries.forEach((e) => {
      if (e.entryType === 'debit') inflow += Number(e.amount || 0);
      else if (e.entryType === 'credit') outflow += Number(e.amount || 0);
    });
    return { inflow, outflow };
  }, [entries]);

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Bank Statement / Ledger"
        subtitle={selectedAccount ? selectedAccount.accountName : 'Bank Accounts'}
      />

      <View style={styles.content}>
        <CustomSelect
          label="Select Bank or Cash Account"
          value={selectedAccountId}
          items={accountOptions}
          onValueChange={setSelectedAccountId}
        />

        {selectedAccount ? (
          <Card style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.accName}>{selectedAccount.accountName}</Text>
                <Text style={styles.accNum}>
                  {selectedAccount.accountNumber || `${selectedAccount.accountType} Account`}
                </Text>
              </View>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
                <Text style={styles.balanceValue}>{formatCurrency(selectedAccount.closingBalance)}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Inflows</Text>
                <Text style={[styles.statValue, { color: '#4ade80' }]}>
                  +{formatCurrency(stats.inflow)}
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Total Outflows</Text>
                <Text style={[styles.statValue, { color: '#f43f5e' }]}>
                  -{formatCurrency(stats.outflow)}
                </Text>
              </View>
            </View>
          </Card>
        ) : null}

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Filter bank statement entries..."
        />

        {/* Inflow / Outflow filter pills */}
        <View style={styles.filterBar}>
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'INFLOW', label: 'Inflows (+)' },
            { id: 'OUTFLOW', label: 'Outflows (-)' },
          ].map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterPill, filterType === f.id ? styles.filterPillActive : null]}
              onPress={() => setFilterType(f.id)}
            >
              <Text style={[styles.filterPillText, filterType === f.id ? styles.filterTextActive : null]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Loader message="Loading Statement..." />
        ) : (
          <FlatList
            data={filteredEntries}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isInflow = item.entryType === 'debit';
              const isOpening = item.entryType === 'opening';

              return (
                <View style={styles.entryRow}>
                  <View style={styles.iconWrapper}>
                    <MaterialCommunityIcons
                      name={
                        isOpening
                          ? 'lock-outline'
                          : isInflow
                          ? 'arrow-down-left-bold'
                          : 'arrow-up-right-bold'
                      }
                      size={20}
                      color={isOpening ? '#38bdf8' : isInflow ? '#4ade80' : '#f43f5e'}
                    />
                  </View>

                  <View style={styles.entryCenter}>
                    <Text style={styles.narration} numberOfLines={2}>
                      {item.narration || item.referenceType}
                    </Text>
                    <Text style={styles.dateText}>
                      {new Date(item.date || item.createdAt).toLocaleDateString('en-IN')} •{' '}
                      {item.referenceType}
                    </Text>
                  </View>

                  <View style={styles.entryRight}>
                    <Text
                      style={[
                        styles.entryAmount,
                        isInflow ? styles.inflowText : !isOpening ? styles.outflowText : null,
                      ]}
                    >
                      {isInflow ? '+' : !isOpening ? '-' : ''}
                      {formatCurrency(item.amount)}
                    </Text>
                    <Text style={styles.runBalText}>
                      Bal: {formatCurrency(item.balanceAfter)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon="bank-transfer-out"
                title="No Bank Transactions"
                description="No statement lines found matching your filters."
              />
            }
          />
        )}
      </View>
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
  summaryCard: {
    marginVertical: 4,
    backgroundColor: '#1e1f29',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  accNum: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  balanceBadge: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },
  balanceValue: {
    color: '#daf4aa',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  statsRow: {
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
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  filterTextActive: {
    color: '#ffffff',
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
    alignItems: 'center',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  entryCenter: {
    flex: 1,
    paddingRight: 8,
  },
  narration: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  inflowText: {
    color: '#4ade80',
  },
  outflowText: {
    color: '#f43f5e',
  },
  runBalText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
});
