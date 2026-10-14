import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import Card from '../components/common/Card';
import Loader from '../components/common/Loader';
import { query } from '../database/db';
import { getAllAccounts } from '../database/handlers/accountHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function BankManagementScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [allAccs, transfers] = await Promise.all([
        getAllAccounts(),
        query(`
          SELECT l.*, a.accountName
          FROM ledger l
          LEFT JOIN accounts a ON l.accountId = a.id
          WHERE l.referenceType IN ('Transfer', 'BankAdjustment(Manual)')
          ORDER BY l.date DESC, l.createdAt DESC
          LIMIT 8
        `),
      ]);
      const liquidAccs = (allAccs || []).filter((a) =>
        ['Bank', 'Cash', 'GPay'].includes(a.accountType)
      );
      setAccounts(liquidAccs);
      setRecentTransfers(transfers || []);
    } catch (err) {
      console.warn('Bank management data fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalLiquid = useMemo(() => {
    return accounts.reduce((sum, a) => sum + Number(a.closingBalance || 0), 0);
  }, [accounts]);

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Bank Management" subtitle="Treasury & Accounts" />
        <Loader fullScreen message="Loading Banking Assets..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Bank Management"
        subtitle="Treasury, Accounts & Transfers"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#daf4aa"
            colors={['#7c3aed']}
          />
        }
      >
        {/* Total Liquid Capital Card */}
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL LIQUID CAPITAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalLiquid)}</Text>
          <Text style={styles.totalSub}>
            Combined closing balance across {accounts.length} bank, cash & GPay accounts
          </Text>
        </Card>

        {/* Quick Treasury Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('TransferAmount')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={22} color="#38bdf8" />
            </View>
            <Text style={styles.actionTitle}>Transfer Funds</Text>
            <Text style={styles.actionSub}>Between accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Accounts')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(218, 244, 170, 0.15)' }]}>
              <MaterialCommunityIcons name="bank-plus" size={22} color="#daf4aa" />
            </View>
            <Text style={styles.actionTitle}>Manage Accounts</Text>
            <Text style={styles.actionSub}>Create or edit</Text>
          </TouchableOpacity>
        </View>

        {/* Accounts List */}
        <Text style={styles.sectionTitle}>Active Banking Accounts</Text>
        {accounts.map((acc) => (
          <Card
            key={acc.id}
            style={styles.accCard}
            title={acc.accountName}
            subtitle={acc.accountNumber ? `A/C: ${acc.accountNumber}` : `${acc.accountType} Account`}
            badge={acc.accountType}
            badgeColor={
              acc.accountType === 'Bank'
                ? 'rgba(96, 165, 250, 0.15)'
                : acc.accountType === 'Cash'
                ? 'rgba(74, 222, 128, 0.15)'
                : 'rgba(192, 132, 252, 0.15)'
            }
            badgeTextColor={
              acc.accountType === 'Bank'
                ? '#60a5fa'
                : acc.accountType === 'Cash'
                ? '#4ade80'
                : '#c084fc'
            }
            icon={
              <MaterialCommunityIcons
                name={
                  acc.accountType === 'Bank'
                    ? 'bank'
                    : acc.accountType === 'Cash'
                    ? 'cash'
                    : 'google'
                }
                size={20}
                color="#daf4aa"
              />
            }
            onPress={() => navigation.navigate('BankLedger', { accountId: acc.id })}
          >
            <View style={styles.accMetrics}>
              <View>
                <Text style={styles.metricLabel}>Closing Balance</Text>
                <Text style={styles.metricValue}>{formatCurrency(acc.closingBalance)}</Text>
              </View>
              <View style={styles.ledgerBtn}>
                <Text style={styles.ledgerBtnText}>View Ledger</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#daf4aa" />
              </View>
            </View>
          </Card>
        ))}

        {/* Recent Banking Transactions */}
        <Text style={styles.sectionTitle}>Recent Transfers & Adjustments</Text>
        {recentTransfers.length > 0 ? (
          recentTransfers.map((t) => (
            <Card key={t.id} style={styles.transferCard}>
              <View style={styles.transferRow}>
                <View style={styles.transferIconWrapper}>
                  <MaterialCommunityIcons
                    name={t.entryType === 'debit' ? 'arrow-down-left' : 'arrow-up-right'}
                    size={20}
                    color={t.entryType === 'debit' ? '#4ade80' : '#f43f5e'}
                  />
                </View>
                <View style={styles.transferInfo}>
                  <Text style={styles.transferAccount}>{t.accountName || 'Bank Account'}</Text>
                  <Text style={styles.transferNarration} numberOfLines={1}>
                    {t.narration || t.referenceType}
                  </Text>
                  <Text style={styles.transferDate}>
                    {new Date(t.date || t.createdAt).toLocaleDateString('en-IN')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transferAmount,
                    t.entryType === 'debit' ? { color: '#4ade80' } : { color: '#f43f5e' },
                  ]}
                >
                  {t.entryType === 'debit' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </Text>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent banking transactions</Text>
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
  totalCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    marginVertical: 4,
    padding: 18,
  },
  totalLabel: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  totalSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#20212a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
  },
  accCard: {
    marginVertical: 4,
  },
  accMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  ledgerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledgerBtnText: {
    color: '#daf4aa',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  transferCard: {
    marginVertical: 3,
    padding: 12,
  },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transferIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  transferInfo: {
    flex: 1,
  },
  transferAccount: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  transferNarration: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 1,
  },
  transferDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  transferAmount: {
    fontSize: 14,
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
