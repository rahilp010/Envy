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
import { getTodaysAnalytics } from '../database/handlers/reportHandlers';
import { query } from '../database/db';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function TodaysAnalyticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [todayTransactions, setTodayTransactions] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const data = await getTodaysAnalytics();
      setAnalytics(data);

      const today = new Date().toISOString().split('T')[0];
      const [todaySales, todayPurchases] = await Promise.all([
        query(
          `SELECT s.id, s.billNo, s.date, s.totalAmountWithTax as amount, s.statusOfTransaction, 'Sale' as type, c.clientName 
           FROM sales s LEFT JOIN clients c ON s.clientId = c.id 
           WHERE date(s.date) = date(?) ORDER BY s.id DESC LIMIT 10`,
          [today]
        ),
        query(
          `SELECT p.id, p.billNo, p.date, p.totalAmountWithTax as amount, p.statusOfTransaction, 'Purchase' as type, c.clientName 
           FROM purchases p LEFT JOIN clients c ON p.clientId = c.id 
           WHERE date(p.date) = date(?) ORDER BY p.id DESC LIMIT 10`,
          [today]
        ),
      ]);

      const merged = [...(todaySales || []), ...(todayPurchases || [])].sort((a, b) => b.id - a.id);
      setTodayTransactions(merged);
    } catch (err) {
      console.error('Error loading today analytics:', err);
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

  const salesTotal = analytics?.sales?.total || 0;
  const purchasesTotal = analytics?.purchases?.total || 0;
  const netMargin = salesTotal - purchasesTotal;
  const collections = analytics?.sales?.paid || 0;
  const payments = analytics?.purchases?.paid || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Today's Analytics"
        subtitle="Live Daily Financial Overview"
        leftAction="menu"
      />

      {loading ? (
        <Loader fullScreen={false} message="Calculating today's numbers..." />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
        >
          {/* Date Banner */}
          <View style={styles.dateBanner}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color="#daf4aa" />
            <Text style={styles.dateBannerText}>
              Live Snapshot for {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {/* 4 Hero Counters */}
          <View style={styles.grid}>
            {/* Today Sales */}
            <View style={[styles.counterCard, { borderColor: 'rgba(218, 244, 170, 0.2)' }]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(218, 244, 170, 0.1)' }]}>
                  <MaterialCommunityIcons name="cart-arrow-up" size={18} color="#daf4aa" />
                </View>
                <Text style={styles.countBadge}>{analytics?.sales?.count || 0} bills</Text>
              </View>
              <Text style={styles.cardTitle}>TODAY'S SALES</Text>
              <Text style={[styles.cardVal, { color: '#daf4aa' }]}>₹{salesTotal.toFixed(2)}</Text>
              <Text style={styles.cardSub}>Paid: ₹{(analytics?.sales?.paid || 0).toFixed(2)}</Text>
            </View>

            {/* Today Purchases */}
            <View style={[styles.counterCard, { borderColor: 'rgba(244, 114, 182, 0.2)' }]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(244, 114, 182, 0.1)' }]}>
                  <MaterialCommunityIcons name="cart-arrow-down" size={18} color="#f472b6" />
                </View>
                <Text style={styles.countBadge}>{analytics?.purchases?.count || 0} bills</Text>
              </View>
              <Text style={styles.cardTitle}>TODAY'S PURCHASES</Text>
              <Text style={[styles.cardVal, { color: '#f472b6' }]}>₹{purchasesTotal.toFixed(2)}</Text>
              <Text style={styles.cardSub}>Paid: ₹{(analytics?.purchases?.paid || 0).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {/* Today Collections */}
            <View style={styles.counterCard}>
              <View style={styles.cardTop}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <MaterialCommunityIcons name="arrow-bottom-left" size={18} color="#10b981" />
                </View>
              </View>
              <Text style={styles.cardTitle}>COLLECTIONS INFLOW</Text>
              <Text style={[styles.cardVal, { color: '#10b981' }]}>₹{collections.toFixed(2)}</Text>
              <Text style={styles.cardSub}>Cleared Cash/Bank</Text>
            </View>

            {/* Today Payments */}
            <View style={styles.counterCard}>
              <View style={styles.cardTop}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <MaterialCommunityIcons name="arrow-top-right" size={18} color="#ef4444" />
                </View>
              </View>
              <Text style={styles.cardTitle}>PAYMENTS OUTFLOW</Text>
              <Text style={[styles.cardVal, { color: '#ef4444' }]}>₹{payments.toFixed(2)}</Text>
              <Text style={styles.cardSub}>Disbursed Cash/Bank</Text>
            </View>
          </View>

          {/* Net Margin Card */}
          <View style={styles.marginCard}>
            <View style={styles.marginHeader}>
              <Text style={styles.marginTitle}>Estimated Day Margin (Sales - Purchases)</Text>
              <MaterialCommunityIcons
                name={netMargin >= 0 ? 'trending-up' : 'trending-down'}
                size={22}
                color={netMargin >= 0 ? '#10b981' : '#f43f5e'}
              />
            </View>
            <Text style={[styles.marginAmount, { color: netMargin >= 0 ? '#10b981' : '#f43f5e' }]}>
              {netMargin >= 0 ? '+' : ''}₹{netMargin.toFixed(2)}
            </Text>
            <Text style={styles.marginHint}>
              {netMargin >= 0
                ? 'Healthy daily cashflow surplus'
                : 'Purchases exceeded sales bookings today'}
            </Text>
          </View>

          {/* Today Transactions Log */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S ACTIVITY FEED ({todayTransactions.length})</Text>
          </View>

          {todayTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="timer-sand-empty" size={32} color="#64748b" />
              <Text style={styles.emptyCardText}>No sales or purchases created yet today</Text>
            </View>
          ) : (
            todayTransactions.map((tx, idx) => {
              const isSale = tx.type === 'Sale';
              return (
                <View key={idx} style={styles.txRow}>
                  <View style={[styles.txIconPill, isSale ? styles.salePill : styles.purPill]}>
                    <MaterialCommunityIcons
                      name={isSale ? 'arrow-bottom-left' : 'arrow-top-right'}
                      size={16}
                      color={isSale ? '#daf4aa' : '#f472b6'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.txBillNo}>{tx.billNo || 'TXN'}</Text>
                    <Text style={styles.txClient}>{tx.clientName || 'General'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txAmt, isSale ? { color: '#daf4aa' } : { color: '#f472b6' }]}>
                      ₹{parseFloat(tx.amount || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.txStatus}>{(tx.statusOfTransaction || 'completed').toUpperCase()}</Text>
                  </View>
                </View>
              );
            })
          )}
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
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161d2d',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.15)',
  },
  dateBannerText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  marginCard: {
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  marginHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  marginAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 4,
  },
  marginHint: {
    color: '#64748b',
    fontSize: 11,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyCard: {
    backgroundColor: '#161d2d',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyCardText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161d2d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  txIconPill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salePill: {
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
  },
  purPill: {
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
  },
  txBillNo: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  txClient: {
    color: '#94a3b8',
    fontSize: 11,
  },
  txAmt: {
    fontSize: 13,
    fontWeight: '700',
  },
  txStatus: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});
