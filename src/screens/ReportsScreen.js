import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import Loader from '../components/common/Loader';
import { getTrialBalance, getPendingCollections, getPendingPayments } from '../database/handlers/reportHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function ReportsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trialBalance, setTrialBalance] = useState({ totalDebit: 0, totalCredit: 0, isBalanced: true });
  const [pendingCollCount, setPendingCollCount] = useState(0);
  const [pendingPayCount, setPendingPayCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [tb, pc, pp] = await Promise.all([
        getTrialBalance(),
        getPendingCollections(),
        getPendingPayments(),
      ]);
      setTrialBalance(tb);
      setPendingCollCount((pc || []).length);
      setPendingPayCount((pp || []).length);
    } catch (err) {
      console.error('Error fetching reports data:', err);
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

  const REPORT_CARDS = [
    {
      title: 'General Ledger Report',
      subtitle: 'Double-entry running balances per account',
      icon: 'book-open-outline',
      iconColor: '#daf4aa',
      route: 'Ledger',
      tag: 'Accounting',
    },
    {
      title: 'Trial Balance Audit',
      subtitle: `DR: ₹${trialBalance.totalDebit.toFixed(2)} | CR: ₹${trialBalance.totalCredit.toFixed(2)}`,
      icon: 'scale-balance',
      iconColor: trialBalance.isBalanced ? '#10b981' : '#f43f5e',
      route: 'Ledger',
      tag: trialBalance.isBalanced ? 'Balanced' : 'Discrepancy',
    },
    {
      title: 'Accounts Receivable (Pending Collections)',
      subtitle: `${pendingCollCount} customers with unpaid invoices`,
      icon: 'arrow-bottom-left',
      iconColor: '#38bdf8',
      route: 'PendingCollection',
      tag: 'Debtors',
    },
    {
      title: 'Accounts Payable (Pending Payments)',
      subtitle: `${pendingPayCount} suppliers with pending bills`,
      icon: 'arrow-top-right',
      iconColor: '#f472b6',
      route: 'PendingPayment',
      tag: 'Creditors',
    },
    {
      title: 'Sales Transactions Register',
      subtitle: 'Complete list of all sales invoices & GST breakdowns',
      icon: 'cart-arrow-up',
      iconColor: '#daf4aa',
      route: 'Sales',
      tag: 'Sales',
    },
    {
      title: 'Purchase Bills Register',
      subtitle: 'Complete log of vendor bills, taxes and payments',
      icon: 'cart-arrow-down',
      iconColor: '#f472b6',
      route: 'Purchase',
      tag: 'Purchases',
    },
    {
      title: 'Bank & Cash Accounts Register',
      subtitle: 'Real-time balances across all banks, cash & GPay',
      icon: 'bank',
      iconColor: '#a78bfa',
      route: 'BankManagement',
      tag: 'Banking',
    },
    {
      title: 'Staff Payroll & Salaries',
      subtitle: 'Employee payouts, history, and salary expenses',
      icon: 'cash-multiple',
      iconColor: '#fbbf24',
      route: 'Salary',
      tag: 'Payroll',
    },
    {
      title: 'Product Warranties Report',
      subtitle: 'Track expiring and active item warranties',
      icon: 'shield-check-outline',
      iconColor: '#34d399',
      route: 'Warranty',
      tag: 'Service',
    },
    {
      title: 'System Audit Trail & Action Logs',
      subtitle: 'Timestamped history of all DB creates, updates & deletes',
      icon: 'clipboard-text-clock-outline',
      iconColor: '#94a3b8',
      route: 'ActionLogs',
      tag: 'Security',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Financial Reports"
        subtitle="Registers, Audit Trails & Statements"
        leftAction="menu"
      />

      {loading ? (
        <Loader fullScreen={false} message="Loading financial indices..." />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
        >
          {REPORT_CARDS.map((card, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => navigation.navigate(card.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${card.iconColor}18` }]}>
                <MaterialCommunityIcons name={card.icon} size={22} color={card.iconColor} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{card.tag}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>{card.subtitle}</Text>
              </View>

              <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
            </TouchableOpacity>
          ))}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  tagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  tagText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  cardSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
});
