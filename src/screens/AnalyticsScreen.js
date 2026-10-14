import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/common/AppHeader';
import Loader from '../components/common/Loader';
import { query, queryRow } from '../database/db';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AnalyticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalPurchases: 0,
    salesCount: 0,
    purchasesCount: 0,
    topClients: [],
    topProducts: [],
    paymentMethods: [],
    monthlyTrends: [],
  });

  const loadData = useCallback(async () => {
    try {
      // 1. Sales & Purchases Totals
      const salesAgg = await queryRow(`
        SELECT COALESCE(SUM(totalAmountWithTax), 0) as total, COUNT(*) as count 
        FROM sales
      `);
      const purchasesAgg = await queryRow(`
        SELECT COALESCE(SUM(totalAmountWithTax), 0) as total, COUNT(*) as count 
        FROM purchases
      `);

      // 2. Top Clients by Revenue
      const topClients = await query(`
        SELECT c.clientName, COALESCE(SUM(s.totalAmountWithTax), 0) as revenue, COUNT(s.id) as bills
        FROM clients c
        INNER JOIN sales s ON s.clientId = c.id
        GROUP BY c.id
        ORDER BY revenue DESC
        LIMIT 5
      `);

      // 3. Top Products Sold
      const topProducts = await query(`
        SELECT p.productName, COALESCE(SUM(s.quantity), 0) as totalQty, COALESCE(SUM(s.saleAmount), 0) as totalRevenue
        FROM products p
        INNER JOIN sales s ON s.productId = p.id
        GROUP BY p.id
        ORDER BY totalRevenue DESC
        LIMIT 5
      `);

      // 4. Payment Methods Distribution
      const payMethods = await query(`
        SELECT paymentMethod, COUNT(*) as count, COALESCE(SUM(totalAmountWithTax), 0) as total
        FROM sales
        GROUP BY paymentMethod
        ORDER BY total DESC
      `);

      // 5. Monthly Trends (Last 6 Months)
      const monthly = await query(`
        SELECT strftime('%Y-%m', date) as month,
               COALESCE(SUM(totalAmountWithTax), 0) as salesAmount
        FROM sales
        WHERE date IS NOT NULL
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
      `);

      setMetrics({
        totalSales: salesAgg?.total || 0,
        totalPurchases: purchasesAgg?.total || 0,
        salesCount: salesAgg?.count || 0,
        purchasesCount: purchasesAgg?.count || 0,
        topClients: topClients || [],
        topProducts: topProducts || [],
        paymentMethods: payMethods || [],
        monthlyTrends: (monthly || []).reverse(),
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
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

  const netProfit = metrics.totalSales - metrics.totalPurchases;
  const maxMonthly = Math.max(1, ...metrics.monthlyTrends.map((m) => m.salesAmount || 0));

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Financial Analytics"
        subtitle="Business Performance & Revenue Metrics"
        leftAction="menu"
      />

      {loading ? (
        <Loader fullScreen={false} message="Analyzing financial figures..." />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
        >
          {/* Big Summary Banner */}
          <View style={styles.summaryBanner}>
            <Text style={styles.bannerSub}>LIFETIME REVENUE & MARGIN</Text>
            <View style={styles.bannerRow}>
              <View>
                <Text style={styles.bannerLabel}>Total Sales Turnover</Text>
                <Text style={styles.salesHero}>₹{metrics.totalSales.toFixed(2)}</Text>
                <Text style={styles.countText}>{metrics.salesCount} Invoices Cleared</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.bannerLabel}>Net Margin</Text>
                <Text style={[styles.marginHero, { color: netProfit >= 0 ? '#10b981' : '#f43f5e' }]}>
                  {netProfit >= 0 ? '+' : ''}₹{netProfit.toFixed(2)}
                </Text>
                <Text style={styles.countText}>
                  Purchases: ₹{metrics.totalPurchases.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Monthly Revenue Visual Trend Bars */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>MONTHLY REVENUE TRENDS</Text>
            {metrics.monthlyTrends.length === 0 ? (
              <Text style={styles.emptyNote}>No monthly transaction data available yet</Text>
            ) : (
              metrics.monthlyTrends.map((item, idx) => {
                const pct = Math.min(100, Math.round((item.salesAmount / maxMonthly) * 100));
                return (
                  <View key={idx} style={styles.barItem}>
                    <View style={styles.barMeta}>
                      <Text style={styles.barLabel}>{item.month}</Text>
                      <Text style={styles.barVal}>₹{parseFloat(item.salesAmount).toFixed(2)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Payment Methods Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>PAYMENT METHOD DISTRIBUTION</Text>
            {metrics.paymentMethods.length === 0 ? (
              <Text style={styles.emptyNote}>No payment method data recorded</Text>
            ) : (
              metrics.paymentMethods.map((pm, idx) => {
                const totalAll = metrics.totalSales || 1;
                const pct = Math.round((pm.total / totalAll) * 100);
                return (
                  <View key={idx} style={styles.payRow}>
                    <View style={styles.payLeft}>
                      <MaterialCommunityIcons
                        name={
                          pm.paymentMethod === 'bank'
                            ? 'bank'
                            : pm.paymentMethod === 'cash'
                            ? 'cash'
                            : pm.paymentMethod === 'googlepay'
                            ? 'cellphone'
                            : 'wallet'
                        }
                        size={16}
                        color="#daf4aa"
                      />
                      <Text style={styles.payName}>
                        {(pm.paymentMethod || 'other').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.payRight}>
                      <Text style={styles.payAmt}>₹{parseFloat(pm.total).toFixed(2)}</Text>
                      <Text style={styles.payPct}>{pct}%</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Top 5 Clients */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>TOP VALUED CLIENTS (BY REVENUE)</Text>
            {metrics.topClients.length === 0 ? (
              <Text style={styles.emptyNote}>No sales per client recorded yet</Text>
            ) : (
              metrics.topClients.map((c, idx) => (
                <View key={idx} style={styles.rankRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankNum}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rankName}>{c.clientName}</Text>
                    <Text style={styles.rankSub}>{c.bills} transactions</Text>
                  </View>
                  <Text style={styles.rankAmount}>₹{parseFloat(c.revenue).toFixed(2)}</Text>
                </View>
              ))
            )}
          </View>

          {/* Top Products */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>TOP PERFORMING PRODUCTS</Text>
            {metrics.topProducts.length === 0 ? (
              <Text style={styles.emptyNote}>No products sold yet</Text>
            ) : (
              metrics.topProducts.map((p, idx) => (
                <View key={idx} style={styles.rankRow}>
                  <View style={[styles.rankBadge, { backgroundColor: 'rgba(124, 58, 237, 0.2)' }]}>
                    <Text style={[styles.rankNum, { color: '#a78bfa' }]}>{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rankName}>{p.productName}</Text>
                    <Text style={styles.rankSub}>{p.totalQty} units sold</Text>
                  </View>
                  <Text style={[styles.rankAmount, { color: '#a78bfa' }]}>
                    ₹{parseFloat(p.totalRevenue).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryBanner: {
    backgroundColor: '#161d2d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.15)',
  },
  bannerSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bannerLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  salesHero: {
    color: '#daf4aa',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  marginHero: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  countText: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emptyNote: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  barItem: {
    marginBottom: 12,
  },
  barMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  barVal: {
    color: '#daf4aa',
    fontSize: 12,
    fontWeight: '700',
  },
  barTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#daf4aa',
    borderRadius: 4,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  payLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  payRight: {
    alignItems: 'flex-end',
  },
  payAmt: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  payPct: {
    color: '#64748b',
    fontSize: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNum: {
    color: '#daf4aa',
    fontSize: 11,
    fontWeight: '800',
  },
  rankName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  rankSub: {
    color: '#64748b',
    fontSize: 11,
  },
  rankAmount: {
    color: '#daf4aa',
    fontSize: 13,
    fontWeight: '700',
  },
});
