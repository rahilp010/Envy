import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { query, queryRow } from '../database/db';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [metrics, setMetrics] = useState({
    bankBalance: 0,
    cashBalance: 0,
    totalSales: 0,
    pendingCollections: 0,
    totalPurchases: 0,
    pendingPayments: 0,
    productCount: 0,
    clientCount: 0,
    accountCount: 0,
    recentLogs: [],
  });

  const loadData = useCallback(async () => {
    try {
      // 1. Accounts: Bank and Cash
      const accounts = await query('SELECT accountType, closingBalance, openingBalance FROM accounts');
      let bank = 0;
      let cash = 0;
      accounts.forEach((acc) => {
        const bal = acc.closingBalance !== null ? Number(acc.closingBalance) : Number(acc.openingBalance || 0);
        if (acc.accountType === 'Bank') bank += bal;
        if (acc.accountType === 'Cash') cash += bal;
      });

      // 2. Sales Totals
      const sales = await query('SELECT totalAmountWithTax, statusOfTransaction, paymentType, pendingFromOurs, pendingAmount FROM sales');
      let salesTotal = 0;
      let pendingColl = 0;
      sales.forEach((s) => {
        salesTotal += Number(s.totalAmountWithTax || 0);
        if (s.statusOfTransaction === 'pending') {
          pendingColl += s.paymentType === 'full' ? Number(s.totalAmountWithTax || 0) : Number(s.pendingAmount || s.pendingFromOurs || 0);
        }
      });

      // 3. Purchase Totals
      const purchases = await query('SELECT totalAmountWithTax, statusOfTransaction, paymentType, pendingFromOurs, pendingAmount FROM purchases');
      let purchaseTotal = 0;
      let pendingPay = 0;
      purchases.forEach((p) => {
        purchaseTotal += Number(p.totalAmountWithTax || 0);
        if (p.statusOfTransaction === 'pending') {
          pendingPay += p.paymentType === 'full' ? Number(p.totalAmountWithTax || 0) : Number(p.pendingFromOurs || p.pendingAmount || 0);
        }
      });

      // 4. Counts
      const pCount = await queryRow('SELECT COUNT(*) as count FROM products');
      const cCount = await queryRow('SELECT COUNT(*) as count FROM clients');
      const aCount = await queryRow('SELECT COUNT(*) as count FROM accounts');

      // 5. Recent Action Logs
      const logs = await query('SELECT * FROM action_logs ORDER BY createdAt DESC LIMIT 5');

      setMetrics({
        bankBalance: bank,
        cashBalance: cash,
        totalSales: salesTotal,
        pendingCollections: pendingColl,
        totalPurchases: purchaseTotal,
        pendingPayments: pendingPay,
        productCount: pCount?.count || 0,
        clientCount: cCount?.count || 0,
        accountCount: aCount?.count || 0,
        recentLogs: logs || [],
      });
    } catch (err) {
      console.warn('Dashboard data fetch warning:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Dashboard" subtitle="ENVY ERP System" />
        <Loader fullScreen message="Loading ERP Analytics..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Dashboard"
        subtitle="Business Overview & Quick Actions"
        rightActions={
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => loadData()}
          >
            <MaterialCommunityIcons name="refresh" size={22} color="#daf4aa" />
          </TouchableOpacity>
        }
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
        {/* Top Financial Overview - Adjusted to full width to avoid overlap */}
        <View style={styles.columnLayout}>
          <Card
            style={styles.fullWidthCard}
            icon={
              <MaterialCommunityIcons name="bank" size={18} color="#60a5fa" />
            }
            title="Bank Balance"
            badge="ACTIVE"
            badgeColor="rgba(96, 165, 250, 0.15)"
            badgeTextColor="#60a5fa"
          >
            <Text style={styles.statValue}>{formatCurrency(metrics.bankBalance)}</Text>
            <Text style={styles.statSub}>Total bank closing balance</Text>
          </Card>

          <Card
            style={styles.fullWidthCard}
            icon={
              <MaterialCommunityIcons name="cash" size={18} color="#4ade80" />
            }
            title="Cash In Hand"
            badge="CASH"
            badgeColor="rgba(74, 222, 128, 0.15)"
            badgeTextColor="#4ade80"
          >
            <Text style={styles.statValue}>{formatCurrency(metrics.cashBalance)}</Text>
            <Text style={styles.statSub}>Liquid cash accounts</Text>
          </Card>
        </View>

        {/* Sales & Collections - Titles & badges shortened to fit side-by-side cleanly */}
        <View style={styles.row}>
          <Card
            style={styles.statCard}
            icon={
              <MaterialCommunityIcons name="trending-up" size={18} color="#daf4aa" />
            }
            title="Sales"
            badge="REV"
            badgeColor="rgba(218, 244, 170, 0.15)"
            badgeTextColor="#daf4aa"
            onPress={() => navigation.navigate('Sales')}
          >
            <Text style={styles.statValue}>{formatCurrency(metrics.totalSales)}</Text>
            <View style={styles.pendingRow}>
              <Text style={styles.pendingLabel}>Pending:</Text>
              <Text style={styles.pendingValue}>
                {formatCurrency(metrics.pendingCollections)}
              </Text>
            </View>
          </Card>

          <Card
            style={styles.statCard}
            icon={
              <MaterialCommunityIcons name="cart-outline" size={18} color="#f472b6" />
            }
            title="Buys"
            badge="EXP"
            badgeColor="rgba(244, 114, 182, 0.15)"
            badgeTextColor="#f472b6"
            onPress={() => navigation.navigate('Purchase')}
          >
            <Text style={styles.statValue}>{formatCurrency(metrics.totalPurchases)}</Text>
            <View style={styles.pendingRow}>
              <Text style={styles.pendingLabel}>To Pay:</Text>
              <Text style={styles.pendingValuePay}>
                {formatCurrency(metrics.pendingPayments)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Quick Links & Counters */}
        <Text style={styles.sectionTitle}>Master Catalogs</Text>
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => navigation.navigate('Products')}
            activeOpacity={0.8}
          >
            <View style={[styles.catalogIconWrapper, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
              <MaterialCommunityIcons name="package-variant" size={24} color="#a78bfa" />
            </View>
            <Text style={styles.catalogCount}>{metrics.productCount}</Text>
            <Text style={styles.catalogLabel}>Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => navigation.navigate('Clients')}
            activeOpacity={0.8}
          >
            <View style={[styles.catalogIconWrapper, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <MaterialCommunityIcons name="account-group" size={24} color="#38bdf8" />
            </View>
            <Text style={styles.catalogCount}>{metrics.clientCount}</Text>
            <Text style={styles.catalogLabel}>Clients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => navigation.navigate('Accounts')}
            activeOpacity={0.8}
          >
            <View style={[styles.catalogIconWrapper, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
              <MaterialCommunityIcons name="bank-outline" size={24} color="#fb923c" />
            </View>
            <Text style={styles.catalogCount}>{metrics.accountCount}</Text>
            <Text style={styles.catalogLabel}>Accounts</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Workflows</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionGridItem}
            onPress={() => navigation.navigate('Sales')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus-circle" size={20} color="#daf4aa" />
            <Text style={styles.actionGridText}>New Sale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridItem}
            onPress={() => navigation.navigate('Purchase')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color="#a78bfa" />
            <Text style={styles.actionGridText}>New Purchase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridItem}
            onPress={() => navigation.navigate('Ledger')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#38bdf8" />
            <Text style={styles.actionGridText}>Ledger Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridItem}
            onPress={() => navigation.navigate('BankManagement')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#fb923c" />
            <Text style={styles.actionGridText}>Transfer Funds</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Action Audit</Text>
        {metrics.recentLogs.length > 0 ? (
          metrics.recentLogs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={styles.logIconWrapper}>
                  <MaterialCommunityIcons
                    name={
                      log.actionType === 'CREATE'
                        ? 'plus-box'
                        : log.actionType === 'UPDATE'
                          ? 'pencil-box'
                          : 'trash-can'
                    }
                    size={20}
                    color={
                      log.actionType === 'CREATE'
                        ? '#4ade80'
                        : log.actionType === 'UPDATE'
                          ? '#38bdf8'
                          : '#f43f5e'
                    }
                  />
                </View>
                <View style={styles.logInfo}>
                  <Text style={styles.logTitle}>{log.title || log.module}</Text>
                  <Text style={styles.logDetails} numberOfLines={2}>
                    {log.details || 'No details provided'}
                  </Text>
                  <Text style={styles.logDate}>
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {new Date(log.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent activity logged</Text>
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
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  columnLayout: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  fullWidthCard: {
    width: '100%',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  statSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  pendingRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  pendingLabel: {
    color: '#94a3b8',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  pendingValue: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  pendingValuePay: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  catalogButton: {
    flex: 1,
    backgroundColor: '#20212a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  catalogIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  catalogCount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  catalogLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  actionGridItem: {
    width: '48%',
    backgroundColor: '#20212a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionGridText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 10,
  },
  logCard: {
    marginVertical: 4,
    padding: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  logDetails: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  logDate: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
});