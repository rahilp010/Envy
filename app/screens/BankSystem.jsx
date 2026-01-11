/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import AnimatedCounter from '../utility/AnimatedCounter';
import api from '../services/api';
import Loading from '../animation/Loading';

/* ===================== COLOR PALETTE ===================== */

const COLORS = {
  bg: '#FAFBFC',
  card: '#FFFFFF',
  primary: '#6C7CFF',
  primarySoft: '#dee2f9ff',
  accent: '#FFB703',
  success: '#2EC4B6',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  divider: '#E5E7EB',
  glass: 'rgba(255,255,255,0.7)',
};

/* ===================== SCREEN ===================== */

export default function BankSystem({ navigation }) {
  const [activeAccount, setActiveAccount] = useState('BANK ACCOUNT');
  const [showBalance, setShowBalance] = useState(true);
  const [animatedBalance] = useState(new Animated.Value(1));
  const [account, setAccount] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const res = await api.getAllAccounts();
      setAccount(res);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const currentAccount = account.find(
    acc => acc?.clientId?.clientName === activeAccount,
  );

  console.log(currentAccount);

  const currentBalance = currentAccount?.openingBalance || 0;

  const animateBalanceChange = useCallback(() => {
    animatedBalance.setValue(0.85);
    Animated.spring(animatedBalance, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleEye = () => {
    Animated.timing(animatedBalance, {
      toValue: showBalance ? 0.9 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setShowBalance(prev => !prev);
    });
  };

  const switchAccount = type => {
    setActiveAccount(type);
    animateBalanceChange();
  };

  return (
    <View style={styles.container}>
      <Navbar title="Bank" page="bank" />

      {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.screen}>
        {/* ===================== BALANCE CARD ===================== */}

        <LinearGradient
          colors={[COLORS.primarySoft, COLORS.bg]}
          style={styles.mainCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>

          <Animated.View
            style={{
              // transform: [{ scale: animatedBalance }],
              opacity: animatedBalance,
            }}
          >
            {showBalance ? (
              <AnimatedCounter
                value={currentBalance}
                style={styles.balanceAmount}
              />
            ) : (
              <Text style={styles.balanceAmount}>* * * * * * *</Text>
            )}
          </Animated.View>

          <TouchableOpacity onPress={toggleEye} style={styles.eyeBtn}>
            <Ionicons
              name={showBalance ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {/* CARD TYPE SWITCH */}
          <View style={styles.cardIconRow}>
            <TouchableOpacity onPress={() => switchAccount('BANK ACCOUNT')}>
              {/* <CardIcon icon="card-outline" active={activeAccount === 'Bank'} /> */}
              <Text
                style={[
                  styles.cardIconText,
                  activeAccount === 'BANK ACCOUNT' && styles.cardIconTextActive,
                ]}
              >
                Bank
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => switchAccount('CASH ACCOUNT')}>
              {/* <CardIcon
                icon="wallet-outline"
                active={activeAccount === 'Cash'} 
              />*/}
              <Text
                style={[
                  styles.cardIconText,
                  activeAccount === 'CASH ACCOUNT' && styles.cardIconTextActive,
                ]}
              >
                Cash
              </Text>
            </TouchableOpacity>

            {/* <CardIcon icon="add-outline" /> */}
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.actionsRow}>
            <Action icon="add" label="Add" />
            <Action icon="arrow-up" label="Withdraw" />
            <Action
              icon="swap-horizontal-outline"
              label="Transfer"
              onPress={() => navigation.navigate('Transfer')}
            />
            <Action
              icon="unlink-outline"
              label="Ledger"
              onPress={() =>
                navigation.navigate('LedgerClientList', {
                  client: activeAccount,
                })
              }
            />
          </View>
        </LinearGradient>

        {/* ===================== OTHER SERVICES ===================== */}

        <Text style={styles.sectionTitle}>Other Services</Text>

        <View style={styles.serviceGrid}>
          <ServiceCard
            icon="person-outline"
            label="Accounts"
            onPress={() => navigation.navigate('Account')}
          />
          <ServiceCard icon="analytics-outline" label="Analytics" />
          <ServiceWide
            icon="unlink-outline"
            label="Client Ledger"
            onPress={() => navigation.navigate('LedgerClientList')}
          />
        </View>

        {/* ===================== TRANSACTION ===================== */}
      </View>

      <BottomNav navigation={navigation} active="bank" />
    </View>
  );
}

/* ===================== COMPONENTS ===================== */

const Action = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.action} onPress={onPress}>
    <View style={styles.actionIcon}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ServiceCard = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.serviceCard} onPress={onPress}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
    <Text style={styles.serviceLabel}>{label}</Text>
  </TouchableOpacity>
);

const ServiceWide = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.serviceWide} onPress={onPress}>
    <Ionicons name={icon} size={20} color={COLORS.primary} />
    <Text style={styles.serviceWideLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  screen: { padding: 16 },

  mainCard: {
    borderRadius: 28,
    padding: 20,
    elevation: 2,
    marginTop: -10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },

  balanceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  balanceAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 6,
  },

  eyeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
  },

  cardIconRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 22,
  },

  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardIconActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },

  action: { alignItems: 'center' },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  sectionTitle: {
    marginTop: 28,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  serviceCard: {
    width: '48%',
    height: 72,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  serviceLabel: {
    marginTop: 6,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },

  serviceWide: {
    width: '100%',
    height: 72,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  serviceWideLabel: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  transaction: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  transactionLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  transactionTitle: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  transactionTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  transactionAmount: {
    fontWeight: '800',
    color: '#EF4444',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderBox: {
    padding: 24,
    borderRadius: 20,
  },

  cardIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
    borderWidth: 1,
    borderRadius: 20,
    padding: 6,
    paddingHorizontal: 14,
  },

  cardIconTextActive: {
    color: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
});
