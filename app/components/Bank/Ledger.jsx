/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Navbar from '../Navbar';
import api from '../../services/api';

const Ledger = ({ route }) => {
  const client = route?.params?.client;
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    try {
      setLoading(true);
      const res = await api.getClientLedger(client._id);
      setLedger(res || []);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading…</Text>;
  }

  debugger;
  const openingBalance =
    ledger.length > 0 ? ledger[0].balanceAfter - ledger[0].amount : 0;

  const closingBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balanceAfter : 0;

  return (
    <View style={styles.container}>
      <Navbar title="Ledger" />

      {/* HEADER */}
      <View style={styles.headerCard}>
        <Text style={styles.clientName}>{client?.clientName}</Text>
        <Text style={styles.accountNo}>Account • {client?.accountNumber}</Text>

        <View style={styles.balanceRow}>
          <BalanceBox label="Opening" amount={openingBalance} />
          <BalanceBox label="Closing" amount={closingBalance} />
        </View>
      </View>

      {/* LEDGER LIST */}
      <FlatList
        data={ledger}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <LedgerRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </View>
  );
};

export default Ledger;

const LedgerRow = ({ item }) => {
  const isDebit = item.entryType === 'debit';

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          })}
        </Text>

        <Text style={styles.narration}>{item.narration}</Text>
      </View>

      <View style={styles.amountCol}>
        <Text style={[styles.amount, isDebit ? styles.debit : styles.credit]}>
          {isDebit ? 'DR' : 'CR'} ₹ {item.amount}
        </Text>

        <Text style={styles.balance}>Bal ₹ {item.balanceAfter}</Text>
      </View>
    </View>
  );
};

const BalanceBox = ({ label, amount }) => (
  <View style={styles.balanceBox}>
    <Text style={styles.balanceLabel}>{label}</Text>
    <Text style={[styles.balanceAmount, amount < 0 && { color: '#DC2626' }]}>
      ₹ {Math.abs(amount)}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },

  clientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  accountNo: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  balanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },

  balanceBox: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 12,
  },

  balanceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },

  balanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 4,
  },

  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
  },

  date: {
    fontSize: 12,
    color: '#6B7280',
  },

  narration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },

  amountCol: {
    alignItems: 'flex-end',
  },

  amount: {
    fontSize: 14,
    fontWeight: '800',
  },

  debit: {
    color: '#DC2626', // 🔴 red
  },

  credit: {
    color: '#16A34A', // 🟢 green
  },

  balance: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  divider: {
    height: 10,
  },
});
