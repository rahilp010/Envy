/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import Navbar from '../Navbar';
import api from '../../services/api';
import Loading from '../../animation/Loading';

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

  const openingBalance =
    ledger.length > 0 ? ledger[0].balanceAfter - ledger[0].amount : 0;

  const closingBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balanceAfter : 0;

  return (
    <View style={styles.container}>
      <Navbar title="Ledger Report" page="ledger" />

      {/* HEADER */}
      <View style={styles.headerCard}>
        <Text style={styles.clientName}>{client?.clientName}</Text>
        <Text style={styles.accountNo}>
          {client?.accountNumber} ({client?.accountType})
        </Text>

        <View style={styles.balanceRow}>
          <BalanceBox
            label="Opening Balance"
            amount={openingBalance}
            type="neutral"
          />
          <BalanceBox
            label="Closing Balance"
            amount={closingBalance}
            type={closingBalance >= 0 ? 'credit' : 'debit'}
          />
        </View>
      </View>

      {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      {/* LEDGER LIST */}
      <FlatList
        data={ledger}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <LedgerRow item={item} />}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Ledger Entries</Text>
              <Text style={styles.emptySubtitle}>
                Transactions will appear here once added
              </Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default Ledger;

const LedgerRow = ({ item }) => {
  const isDebit = item.entryType === 'debit';
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <View style={styles.row}>
        {/* LEFT */}
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </Text>

          {/* NARRATION WITH TOOLTIP */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowTooltip(true)}
          >
            <Text
              style={styles.narration}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.narration}
            </Text>
          </TouchableOpacity>

          {item.referenceType && (
            <Text style={styles.reference}>{item.referenceType}</Text>
          )}
        </View>

        {/* RIGHT */}
        <View style={styles.amountCol}>
          <View
            style={[
              styles.amountPill,
              isDebit ? styles.debitBg : styles.creditBg,
            ]}
          >
            <Text
              style={[
                styles.amountText,
                isDebit ? styles.debit : styles.credit,
              ]}
            >
              {isDebit ? '↓' : '↑'} ₹ {item.amount}
            </Text>
          </View>

          <Text style={styles.balance}>Balance ₹ {item.balanceAfter}</Text>
        </View>
      </View>

      {/* TOOLTIP MODAL */}
      <NarrationTooltip
        visible={showTooltip}
        text={item.narration}
        onClose={() => setShowTooltip(false)}
      />
    </>
  );
};

const BalanceBox = ({ label, amount, type }) => {
  const color =
    type === 'credit' ? '#16A34A' : type === 'debit' ? '#DC2626' : '#111827';

  return (
    <View style={styles.balanceBox}>
      <Text style={styles.balanceLabel}>{label}</Text>
      <Text style={[styles.balanceAmount, { color }]}>
        ₹ {Math.abs(amount)}
      </Text>
    </View>
  );
};

const NarrationTooltip = ({ visible, text, onClose }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.tooltipOverlay}>
          <View style={styles.tooltipBox}>
            <Text style={styles.tooltipText}>{text}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  headerCard: {
    // backgroundColor: '#111827',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 18,
    elevation: 6,
  },

  clientName: {
    fontSize: 18,
    fontWeight: '800',
  },

  accountNo: {
    fontSize: 13,
    marginTop: 4,
  },

  balanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },

  balanceBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    elevation: 3,
  },

  balanceLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  balanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },

  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 18,
    elevation: 3,
  },

  date: {
    fontSize: 11,
    color: '#6B7280',
  },

  narration: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },

  reference: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  amountPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  amountText: {
    fontSize: 13,
    fontWeight: '800',
  },

  debitBg: {
    backgroundColor: '#FEE2E2',
  },

  creditBg: {
    backgroundColor: '#DCFCE7',
  },

  debit: {
    color: '#DC2626',
  },

  credit: {
    color: '#16A34A',
  },

  balance: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loaderCard: {
    backgroundColor: '#111827',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: 'center',
  },

  loadingText: {
    color: '#E5E7EB',
    fontSize: 13,
    marginTop: 10,
  },

  amount: {
    fontSize: 14,
    fontWeight: '800',
  },

  divider: {
    height: 10,
  },

  loaderBox: {
    backgroundColor: 'transparent',
    paddingHorizontal: 26,
    paddingVertical: 18,
    borderRadius: 18,
  },

  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  tooltipBox: {
    maxWidth: '85%',
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 8,
  },

  tooltipText: {
    color: '#F9FAFB',
    fontSize: 14,
    lineHeight: 20,
  },
});
