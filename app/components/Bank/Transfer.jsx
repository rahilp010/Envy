/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Animated,
  TouchableWithoutFeedback,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Navbar from '../Navbar';
import api from '../../services/api';
import Loading from '../../animation/Loading';
import { useTheme } from '../../theme/ThemeContext'; // Ensure path is correct
import { DarkTheme, LightTheme } from '../../theme/color'; // Ensure path is correct

const { width } = Dimensions.get('window');

export default function TransferScreen({ navigation }) {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  /* ===================== STATE ===================== */
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState(null);
  const [amount, setAmount] = useState(''); // String for input
  const [pickerType, setPickerType] = useState(null); // 'from' | 'to'
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);
  const [accountSearch, setAccountSearch] = useState('');

  // Animation Refs
  const fromAnim = useRef(new Animated.Value(0)).current;
  const toAnim = useRef(new Animated.Value(0)).current;

  /* ===================== EFFECTS ===================== */
  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [fromAccount]); // Reload history when account changes

  useEffect(() => {
    if (!pickerType) setAccountSearch('');
  }, [pickerType]);

  const filteredAccounts = (accounts || []).filter(acc => {
    if (!accountSearch) return true;

    return (
      acc.accountName?.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.bankName?.toLowerCase().includes(accountSearch.toLowerCase())
    );
  });

  /* ===================== API ===================== */
  const loadAccounts = async () => {
    const res = await api.getAllAccounts();
    setAccounts(res || []);
  };

  const loadHistory = async () => {
    try {
      // Optional: setLoading(true) if you want spinner on history load
      const res = await api.transferAmountHistory();
      setTransferHistory(res || []);
    } catch (e) {
      console.log(e.message);
    }
  };

  const submitTransfer = async () => {
    if (!fromAccount || !toAccount || !amount) return;

    if (fromAccount._id === toAccount._id) {
      Alert.alert('Error', 'Cannot transfer to the same account');
      return;
    }

    try {
      setLoading(true);
      await api.transferAmount({
        fromAccountId: fromAccount._id,
        toAccountId: toAccount._id,
        amount: Number(amount),
        narration: 'Account Transfer',
      });

      setAmount('');
      setPickerType(null);
      setFromAccount(null);
      setToAccount(null);
      loadHistory(); // Refresh history
      Alert.alert('Success', 'Transfer completed successfully');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== ANIMATION ===================== */
  const swapAccounts = () => {
    Animated.parallel([
      Animated.timing(fromAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Swap Data
      setFromAccount(toAccount);
      setToAccount(fromAccount);

      // Reset Positions instantly then animate back to 0
      fromAnim.setValue(-50);
      toAnim.setValue(50);

      Animated.parallel([
        Animated.timing(fromAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(toAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Navbar title="Transfer" page="transfer" />

      {/* Loading Overlay */}
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loaderOverlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      {/* MAIN CONTENT */}
      <View style={styles.safe}>
        <View style={styles.transferStack}>
          {/* FROM CARD */}
          <Animated.View
            style={{
              transform: [{ translateY: fromAnim }],
              zIndex: 1, // Ensure stacking context
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.label}>From Account</Text>
                  <TouchableOpacity onPress={() => setPickerType('from')}>
                    <Text style={styles.accountName}>
                      {fromAccount ? fromAccount.accountName : 'Select Source'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
                  <Text style={styles.badgeText}>Debit</Text>
                </View>
              </View>

              <View style={styles.inputRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  style={styles.amountInput}
                />
              </View>

              <Text style={styles.balanceText}>
                Available: ₹ {fromAccount?.currentBalance ?? '0.00'}
              </Text>
            </View>
          </Animated.View>

          {/* SWAP BUTTON */}
          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={swapAccounts}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* TO CARD */}
          <Animated.View
            style={{
              transform: [{ translateY: toAnim }],
              zIndex: 0,
            }}
          >
            <View style={[styles.card, styles.cardTo]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.label}>To Account</Text>
                  <TouchableOpacity onPress={() => setPickerType('to')}>
                    <Text style={styles.accountName}>
                      {toAccount ? toAccount.accountName : 'Select Destination'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.badgeText}>Credit</Text>
                </View>
              </View>

              <View style={styles.balanceWrapper}>
                <Text style={styles.balanceText}>
                  Current: ₹ {toAccount?.currentBalance ?? '0.00'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* CTA BUTTON */}
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => setConfirmVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>Transfer Now</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* HISTORY LIST */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Transfers</Text>
        <FlatList
          data={transferHistory}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isDebit = item.entryType === 'debit';
            return (
              <View style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View
                    style={[
                      styles.historyIconBox,
                      { backgroundColor: isDebit ? '#FEE2E2' : '#DCFCE7' },
                    ]}
                  >
                    <Ionicons
                      name={isDebit ? 'arrow-up' : 'arrow-down'}
                      size={18}
                      color={isDebit ? '#DC2626' : '#16A34A'}
                    />
                  </View>
                  <View>
                    <Text style={styles.historyName}>
                      {item.accountId?.accountName || 'Unknown Account'}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.date).toLocaleDateString()} •{' '}
                      {new Date(item.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.historyAmount,
                    { color: isDebit ? '#DC2626' : '#16A34A' },
                  ]}
                >
                  {isDebit ? '-' : '+'} ₹{item.amount}
                </Text>
              </View>
            );
          }}
        />
      </View>

      {/* ================= MODALS ================= */}

      {/* ACCOUNT PICKER MODAL */}
      <Modal visible={!!pickerType} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setPickerType(null)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.centerModal}>
                {/* TITLE */}
                <Text style={styles.pickerTitle}>
                  Select{' '}
                  {pickerType === 'from'
                    ? 'Source Account'
                    : 'Destination Account'}
                </Text>

                {/* SEARCH */}
                <View style={styles.searchBox}>
                  <TextInput
                    placeholder="Search account..."
                    placeholderTextColor="#9CA3AF"
                    value={accountSearch}
                    onChangeText={setAccountSearch}
                    style={styles.searchInput}
                    autoFocus
                  />
                </View>

                {/* LIST */}
                <FlatList
                  data={filteredAccounts}
                  keyExtractor={i => i._id}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 320 }}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No accounts found</Text>
                  }
                  renderItem={({ item }) => {
                    const isSelected =
                      (pickerType === 'from' &&
                        fromAccount?._id === item._id) ||
                      (pickerType === 'to' && toAccount?._id === item._id);

                    const isCash = item.accountType === 'Cash';

                    return (
                      <TouchableOpacity
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => {
                          if (pickerType === 'from') setFromAccount(item);
                          else setToAccount(item);
                          setPickerType(null);
                        }}
                      >
                        {/* LEFT */}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.optionText}>
                            {item.accountName}
                          </Text>
                        </View>

                        {/* RIGHT BADGES */}
                        <View style={styles.badgeRow}>
                          {/* ACCOUNT TYPE BADGE */}
                          <View
                            style={[
                              styles.typeBadge,
                              {
                                backgroundColor: isCash ? '#FEF3C7' : '#EFF6FF',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeBadgeText,
                                {
                                  color: isCash ? '#92400E' : '#1D4ED8',
                                },
                              ]}
                            >
                              {Number(item.currentBalance || 0).toLocaleString(
                                'en-IN',
                                {
                                  style: 'currency',
                                  currency: 'INR',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                },
                              )}
                            </Text>
                          </View>

                          {/* SELECTED ICON */}
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={COLORS.primary}
                              style={{ marginLeft: 8 }}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* CONFIRMATION MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Transfer</Text>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>From</Text>
              <Text style={styles.confirmValue}>
                {fromAccount?.accountName}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>To</Text>
              <Text style={styles.confirmValue}>{toAccount?.accountName}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.confirmLabel}>Amount</Text>
              <Text
                style={[
                  styles.confirmValue,
                  { fontSize: 18, color: COLORS.primary },
                ]}
              >
                ₹ {amount}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  setConfirmVisible(false);
                  submitTransfer();
                }}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    safe: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 20,
    },
    loaderOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderBox: {
      backgroundColor: COLORS.card,
      padding: 24,
      borderRadius: 20,
    },

    // === Transfer Cards Stack ===
    transferStack: {
      position: 'relative',
      marginBottom: 24,
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
      height: 155,
      justifyContent: 'space-between',
      // Soft Shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    cardTo: {
      marginTop: 0,
      justifyContent: 'flex-start', // Align items to top for "To" card
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    label: {
      fontSize: 12,
      color: COLORS.muted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    accountName: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currencySymbol: {
      fontSize: 24,
      fontWeight: '700',
      color: COLORS.text,
      marginRight: 8,
    },
    amountInput: {
      flex: 1,
      fontSize: 32,
      fontWeight: '800',
      color: COLORS.text,
      padding: 0, // Remove default Android padding
    },
    balanceText: {
      fontSize: 13,
      color: COLORS.muted,
      fontWeight: '500',
    },
    balanceWrapper: {
      marginTop: 20,
    },

    // === Swap Button ===
    swapContainer: {
      position: 'absolute',
      top: 135, // Perfectly placed between the two cards roughly
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },
    swapBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: COLORS.bg, // Matches background to create "cutout" effect
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },

    // === CTA ===
    ctaBtn: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 20,
      gap: 8,
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    ctaText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },

    // === History ===
    historyContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
    },
    historyItem: {
      backgroundColor: COLORS.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 2,
    },
    historyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    historyIconBox: {
      width: 40,
      height: 40,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    historyName: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.text,
    },
    historyDate: {
      fontSize: 11,
      color: COLORS.muted,
      marginTop: 2,
    },
    historyAmount: {
      fontSize: 15,
      fontWeight: '800',
    },

    // === Modals ===
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 0,
    },
    modalContent: {
      backgroundColor: COLORS.card,
      borderRadius: 24,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    pickerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    pickerItemText: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.text,
    },
    pickerItemSub: {
      fontSize: 12,
      color: COLORS.muted,
      marginTop: 2,
    },

    // Confirm Modal Specifics
    confirmRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    confirmLabel: {
      color: COLORS.muted,
      fontWeight: '600',
    },
    confirmValue: {
      color: COLORS.text,
      fontWeight: '700',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: COLORS.bg === '#000000' ? '#222' : '#F3F4F6',
      borderRadius: 16,
      alignItems: 'center',
    },
    confirmBtn: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: COLORS.primary,
      borderRadius: 16,
      alignItems: 'center',
    },
    cancelText: {
      color: COLORS.text,
      fontWeight: '600',
    },
    confirmText: {
      color: '#fff',
      fontWeight: '700',
    },

    searchInput: {
      height: 40,
      fontSize: 14,
      color: '#111827',
    },

    centerModal: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 16,
      width: '90%',
      maxHeight: '80%',
      alignSelf: 'center',
    },

    pickerTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 10,
      color: '#111827',
    },

    searchBox: {
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },

    optionRowSelected: {
      backgroundColor: '#F8FAFC',
    },

    optionText: {
      fontSize: 15,
      color: '#111827',
    },

    optionSubText: {
      fontSize: 13,
      color: '#6B7280',
      marginTop: 2,
    },

    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },

    typeBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    emptyText: {
      textAlign: 'center',
      color: '#6B7280',
      marginVertical: 20,
    },
  });
