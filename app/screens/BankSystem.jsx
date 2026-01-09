/* eslint-disable react-hooks/exhaustive-deps */
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

export default function BankSystem({ navigation }) {
  const [activeAccount, setActiveAccount] = useState('Bank'); // 'bank' | 'cash'
  const [showBalance, setShowBalance] = useState(true);
  const [animatedBalance] = useState(new Animated.Value(1));
  const [account, setAccount] = useState([]);
  const [loading, setLoading] = useState(false);

  const balances = {
    bank: 20677.9,
    cash: 8450.25,
  };

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

  console.log('account', account);
  console.log('activeAccount', activeAccount);

  const currentAccount = account.find(
    acc => acc?.clientId?.accountType === activeAccount,
  );

  const currentBalance = currentAccount?.currentBalance || 0;

  console.log('currentAccount', currentAccount);

  console.log('currentBalance', currentBalance);

  const animateBalanceChange = useCallback(() => {
    animatedBalance.setValue(0.6);
    Animated.spring(animatedBalance, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleEye = () => {
    Animated.timing(animatedBalance, {
      toValue: showBalance ? 0.85 : 1,
      duration: 200,
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
    <View style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}

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
      <View style={styles.safe}>
        {/* BALANCE CARD */}
        <LinearGradient
          colors={['#F6C17A', '#E8A54D']}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Total Balance</Text>

          <View style={styles.balanceRow}>
            <Animated.Text
              style={[
                styles.balanceAmount,
                {
                  transform: [{ scale: animatedBalance }],
                  opacity: animatedBalance,
                },
              ]}
            >
              {showBalance ? (
                <AnimatedCounter
                  value={currentBalance || 0}
                  style={styles.balanceAmount}
                />
              ) : (
                <Text style={styles.balanceAmount}>₹••••••</Text>
              )}
            </Animated.Text>

            <TouchableOpacity onPress={toggleEye}>
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={20}
              />
            </TouchableOpacity>
            <Text style={{ marginTop: 4, fontSize: 12, color: '#374151' }}>
              {activeAccount === 'Bank' ? 'Bank' : 'Cash'}
            </Text>
          </View>

          <Text style={styles.cardCount}>2 Accounts</Text>

          <View style={styles.cardIcons}>
            <TouchableOpacity onPress={() => switchAccount('Bank')}>
              <IconCircle
                icon="card-outline"
                active={activeAccount === 'Bank'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => switchAccount('Cash')}>
              <IconCircle
                icon="wallet-outline"
                active={activeAccount === 'Cash'}
              />
            </TouchableOpacity>

            <IconCircle icon="add" />
          </View>
        </LinearGradient>

        {/* QUICK ACTIONS */}
        <View style={styles.actionRow}>
          <Action
            icon="arrow-up-outline"
            label="Pay"
            onPress={() => navigation.navigate('Pay')}
          />
          <Action
            icon="swap-horizontal-outline"
            label="Transfer"
            onPress={() => navigation.navigate('Transfer')}
          />
          <Action
            icon="unlink-outline"
            label="Ledger"
            onPress={() => navigation.navigate('LedgerClientList')}
          />
          <Action icon="ellipsis-horizontal" label="More" />
        </View>

        <Text style={styles.sectionTitle}>Other Services</Text>

        {/* <View style={styles.currencyRow}>
          <Currency icon="person-outline" label="Account" />
          <Currency label="€" amount="0.97" />
          <Currency label="£" amount="0.97" />
          <Currency label="Ξ" amount="$2,330.17" />
        </View> */}

        <View style={styles.actionsRowFun}>
          <ActionFunction
            icon="person-outline"
            label="Account"
            color="#FCE8E6"
            onPress={() => navigation.navigate('Account')}
          />
          <ActionFunction
            icon="analytics-outline"
            label="Analytics"
            color="#FFF2C6"
          />
          <TouchableOpacity
            style={styles.fullWidthAction}
            onPress={() => navigation.navigate('LedgerClientList')}
          >
            <Ionicons name="unlink-outline" size={20} color="#111827" />
            <Text style={styles.fullWidthLabel}>Client Ledger</Text>
          </TouchableOpacity>
        </View>

        {/* TRANSACTIONS */}
        {/* <Text style={styles.sectionTitle}>Last Transactions</Text>

        <View style={styles.transaction}>
          <View style={styles.transactionLeft}>
            <View style={styles.transactionIcon}>
              <Ionicons name="download-outline" size={18} />
            </View>

            <View>
              <Text style={styles.transactionTitle}>Blockai studio</Text>
              <Text style={styles.transactionTime}>2 min ago</Text>
            </View>
          </View>

          <Text style={styles.transactionAmount}>- $37.80</Text>
        </View> */}
      </View>
      <BottomNav navigation={navigation} active="bank" />
    </View>
  );
}

/* ---------- COMPONENTS ---------- */

const IconCircle = ({ icon, active }) => {
  return (
    <Animated.View
      style={[
        styles.smallCircle,
        active && {
          borderWidth: 2,
          borderColor: '#111827',
          transform: [{ scale: 1.1 }],
        },
      ]}
    >
      <Ionicons name={icon} size={16} color={active ? '#111827' : '#6B7280'} />
    </Animated.View>
  );
};

const Action = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionItem} onPress={onPress}>
    <View style={styles.actionIcon}>
      <Ionicons name={icon} size={18} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActionFunction = ({ icon, label, color, onPress }) => (
  <View style={styles.actionItemFun}>
    <TouchableOpacity
      style={[styles.actionIconFun, { borderWidth: 2, borderColor: '#E5E7EB' }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color="#111827" />
      <Text style={styles.actionLabelFun}>{label}</Text>
    </TouchableOpacity>
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },

  safe: {
    padding: 20,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)', // 🔥 dim background
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderBox: {
    backgroundColor: 'transparent',
    paddingHorizontal: 26,
    paddingVertical: 18,
    borderRadius: 18,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#fff',
    fontWeight: '800',
  },

  greeting: {
    fontSize: 16,
    fontWeight: '700',
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  balanceCard: {
    borderRadius: 22,
    padding: 18,
  },

  balanceLabel: {
    fontSize: 14,
    color: '#374151',
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },

  balanceAmount: {
    fontSize: 30,
    fontWeight: '900',
  },

  cardCount: {
    fontSize: 12,
    marginTop: 4,
    color: '#374151',
  },

  cardIcons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  smallCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 20,
  },

  actionItem: {
    alignItems: 'center',
    flex: 1,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionLabel: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },

  sectionTitle: {
    marginTop: 26,
    fontSize: 16,
    fontWeight: '800',
  },

  transaction: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  transactionLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  transactionTitle: {
    fontWeight: '700',
  },

  transactionTime: {
    fontSize: 11,
    color: '#6B7280',
  },

  transactionAmount: {
    fontWeight: '800',
    color: '#DC2626',
  },

  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  currencyItem: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  currencyLabel: {
    fontSize: 16,
    fontWeight: '800',
  },

  currencyAmount: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 10,
    marginTop: 30,
    elevation: 6,
  },

  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionsRowFun: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionItemFun: {
    width: '49%',
    marginBottom: 6,
    alignItems: 'center',
    gap: 3,
  },
  actionIconFun: {
    width: '100%',
    height: 72,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  actionLabelFun: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },

  fullWidthAction: {
    width: '100%',
    height: 72,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  fullWidthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});
