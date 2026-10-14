import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CustomInput, CustomSelect } from '../common/CustomControls';
import { query } from '../../database/db';

const METHODS = [
  { id: 'bank', label: 'Bank', icon: 'bank' },
  { id: 'cash', label: 'Cash', icon: 'cash' },
  { id: 'googlepay', label: 'GPay', icon: 'google' },
  { id: 'split', label: 'Split', icon: 'call-split' },
  { id: 'pending', label: 'Pending', icon: 'clock-outline' },
];

export default function PaymentMethod({
  selectedMethod = 'bank',
  onMethodChange,
  paidAmount = 0,
  onPaidAmountChange,
  totalAmount = 0,
  selectedAccountId,
  onAccountChange,
  splitPayments = [],
  onSplitPaymentsChange,
}) {
  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accs = await query(
          "SELECT id, accountName, accountType, closingBalance FROM accounts WHERE accountType IN ('Bank', 'Cash', 'GPay') AND status = 'active'"
        );
        setBankAccounts(accs || []);
      } catch (err) {
        console.warn('Failed to load accounts for payment selector:', err);
      }
    };
    loadAccounts();
  }, []);

  const accountItems = bankAccounts.map((a) => ({
    label: `${a.accountName} (₹${a.closingBalance || 0})`,
    value: a.id,
  }));

  const handleMethodSelect = (methodId) => {
    onMethodChange(methodId);
    if (methodId === 'pending') {
      onPaidAmountChange(0);
    } else if (methodId !== 'split' && (paidAmount === 0 || paidAmount === '0')) {
      onPaidAmountChange(totalAmount);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Payment Mode</Text>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {METHODS.map((m) => {
          const isSelected = selectedMethod === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.tabBtn, isSelected ? styles.tabBtnActive : null]}
              onPress={() => handleMethodSelect(m.id)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={m.icon}
                size={16}
                color={isSelected ? '#daf4aa' : '#94a3b8'}
              />
              <Text style={[styles.tabLabel, isSelected ? styles.tabLabelActive : null]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Conditional Inputs */}
      {selectedMethod !== 'pending' && selectedMethod !== 'split' ? (
        <View style={styles.paymentFields}>
          <CustomSelect
            label="Deposit / Withdrawal Account"
            value={selectedAccountId}
            items={accountItems}
            onValueChange={onAccountChange}
            placeholder="Select Account"
          />

          <CustomInput
            label="Paid Amount (₹)"
            placeholder="0.00"
            keyboardType="numeric"
            value={String(paidAmount)}
            onChangeText={(val) => onPaidAmountChange(val)}
            icon="currency-inr"
          />
        </View>
      ) : null}

      {selectedMethod === 'split' ? (
        <View style={styles.splitSection}>
          <Text style={styles.splitNotice}>
            Record payments split across multiple bank/cash accounts:
          </Text>
          <CustomInput
            label="Total Paid Amount (₹)"
            placeholder="0.00"
            keyboardType="numeric"
            value={String(paidAmount)}
            onChangeText={(val) => onPaidAmountChange(val)}
            icon="currency-inr"
          />
        </View>
      ) : null}

      {selectedMethod === 'pending' ? (
        <View style={styles.pendingNotice}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#f59e0b" />
          <Text style={styles.pendingNoticeText}>
            Payment will be marked as outstanding with pending balance.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1b1b22',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabLabelActive: {
    color: '#daf4aa',
    fontWeight: '800',
  },
  paymentFields: {
    marginTop: 12,
  },
  splitSection: {
    marginTop: 12,
  },
  splitNotice: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  pendingNoticeText: {
    color: '#fbbf24',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});
