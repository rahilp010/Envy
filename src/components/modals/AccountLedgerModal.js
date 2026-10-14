import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAccountLedger, getClientLedger } from '../../database/handlers/ledgerHandlers';

export default function AccountLedgerModal({ visible, onClose, accountId, clientId, title }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      const fetchPromise = clientId
        ? getClientLedger(clientId)
        : accountId
        ? getAccountLedger(accountId)
        : Promise.resolve([]);

      fetchPromise
        .then((res) => setEntries(res || []))
        .finally(() => setLoading(false));
    }
  }, [visible, accountId, clientId]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.title}>{title || 'Account Ledger'}</Text>
            <Text style={styles.subtitle}>Audit entries & running balance</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#daf4aa" />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="book-open-outline" size={40} color="#475569" />
                <Text style={styles.emptyText}>No ledger entries recorded</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isDebit = item.entryType === 'debit';
              return (
                <View style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryDate}>
                      {item.date ? new Date(item.date).toLocaleDateString('en-IN') : '-'}
                    </Text>
                    <View style={[styles.badge, isDebit ? styles.drBadge : styles.crBadge]}>
                      <Text style={[styles.badgeText, isDebit ? styles.drText : styles.crText]}>
                        {isDebit ? 'DEBIT (DR)' : 'CREDIT (CR)'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.refType}>{item.referenceType || 'Entry'}</Text>
                  {item.narration ? <Text style={styles.narration}>{item.narration}</Text> : null}
                  <View style={styles.amtRow}>
                    <Text style={[styles.amount, isDebit ? styles.drAmt : styles.crAmt]}>
                      ₹{parseFloat(item.amount || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.balanceAfter}>
                      Bal: ₹{parseFloat(item.balanceAfter || 0).toFixed(2)} {item.balanceType || 'DR'}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    padding: 6,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 14,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 13,
  },
  entryCard: {
    backgroundColor: '#161d2d',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    color: '#94a3b8',
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  drBadge: {
    backgroundColor: 'rgba(244, 114, 182, 0.15)',
  },
  crBadge: {
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  drText: {
    color: '#f472b6',
  },
  crText: {
    color: '#daf4aa',
  },
  refType: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 13,
    marginTop: 4,
  },
  narration: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  amtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
  },
  drAmt: {
    color: '#f472b6',
  },
  crAmt: {
    color: '#daf4aa',
  },
  balanceAfter: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
});
