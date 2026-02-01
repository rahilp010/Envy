/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  TextInput,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

const PAYMENT_METHODS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    icon: 'google-pay',
    size: 26,
    iconLib: 'FontAwesome5',
  },
  {
    id: 'cash',
    label: 'Cash',
    icon: 'money-bill-wave-alt',
    size: 16,
    iconLib: 'FontAwesome5',
  },
  {
    id: 'cheque',
    label: 'Cheque',
    icon: 'barcode',
    size: 20,
    iconLib: 'FontAwesome5',
  },
  {
    id: 'client',
    label: 'Client to Client',
    icon: 'people-outline',
    size: 22,
    iconLib: 'Ionicons',
  },
];

export default function PaymentModal({
  visible,
  onClose,
  onConfirm,
  clients,
  defaultAmount = '',
}) {
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  const [step, setStep] = useState('method'); // method | amount
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPickerVisible, setClientPickerVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const isChequeInvalid = selectedMethod?.id === 'cheque' && !chequeNo.trim();

  const isClientInvalid = selectedMethod?.id === 'client' && !selectedClient;

  const isInvalid =
    !amount ||
    Number(amount) <= 0 ||
    Number(amount) > Number(defaultAmount) ||
    isChequeInvalid ||
    isClientInvalid;

  useEffect(() => {
    if (visible) {
      setAmount(String(defaultAmount || ''));
    }
  }, [visible, defaultAmount]);

  const filteredClients = clients?.filter(c =>
    c.clientName?.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const resetAndClose = () => {
    setStep('method');
    setSelectedMethod(null);
    setAmount('');
    setChequeNo('');
    setSelectedClient(null);
    setClientPickerVisible(false);
    onClose();
  };

  console.log('Selected method', selectedMethod);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={resetAndClose} />

      <View style={styles.centerWrapper}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <Text style={styles.title}>
            {step === 'method' ? 'Payment Method' : 'Enter Amount'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'method'
              ? 'Select how you want to proceed'
              : selectedMethod?.label}
          </Text>

          {/* STEP 1 – METHOD */}
          {step === 'method' && (
            <View style={{ marginTop: 20 }}>
              {PAYMENT_METHODS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={styles.optionCard}
                  onPress={() => {
                    setSelectedMethod(item);
                    setStep('amount');
                  }}
                >
                  <View style={styles.iconBox}>
                    {item.iconLib === 'FontAwesome5' ? (
                      <FontAwesome5
                        name={item.icon}
                        size={item.size}
                        color={COLORS.text}
                      />
                    ) : (
                      <Ionicons
                        name={item.icon}
                        size={item.size}
                        color={COLORS.text}
                      />
                    )}
                  </View>

                  <Text style={styles.optionText}>{item.label}</Text>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* STEP 2 – AMOUNT */}
          {step === 'amount' && (
            <>
              <View style={styles.amountInputWrap}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  style={styles.amountInput}
                />
              </View>

              {selectedMethod.id === 'cheque' && (
                <TextInput
                  placeholder="Cheque Number"
                  value={chequeNo}
                  onChangeText={setChequeNo}
                  style={styles.input}
                  placeholderTextColor="#9CA3AF"
                />
              )}

              {selectedMethod.id === 'client' && (
                <>
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setClientPickerVisible(true)}
                  >
                    <Text
                      style={selectedClient ? styles.text : styles.placeholder}
                    >
                      {selectedClient?.clientName || 'Select Client'}
                    </Text>
                  </TouchableOpacity>

                  <Modal
                    visible={clientPickerVisible}
                    transparent
                    animationType="fade"
                  >
                    <TouchableWithoutFeedback
                      onPress={() => setClientPickerVisible(false)}
                    >
                      <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                          <View style={styles.pickerBox}>
                            {/* LABEL */}
                            <Text style={styles.pickerTitle}>
                              Select Client
                            </Text>

                            {/* SEARCH */}
                            <View style={styles.searchBox}>
                              <Ionicons
                                name="search-outline"
                                size={18}
                                color="#9CA3AF"
                              />
                              <TextInput
                                placeholder="Search client..."
                                value={clientSearch}
                                onChangeText={setClientSearch}
                                placeholderTextColor="#9CA3AF"
                                style={styles.searchInput}
                              />
                            </View>

                            {/* LIST */}
                            <FlatList
                              data={filteredClients}
                              keyExtractor={i => i._id}
                              keyboardShouldPersistTaps="handled"
                              showsVerticalScrollIndicator={false}
                              ListEmptyComponent={
                                <Text style={styles.emptyText}>
                                  No clients found
                                </Text>
                              }
                              renderItem={({ item }) => {
                                const isSelected =
                                  selectedClient?._id === item._id;

                                return (
                                  <TouchableOpacity
                                    style={[
                                      styles.optionRow,
                                      isSelected && styles.optionActive,
                                    ]}
                                    onPress={() => {
                                      setSelectedClient(item);
                                      setClientPickerVisible(false);
                                      setClientSearch('');
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextActive,
                                      ]}
                                    >
                                      {item.clientName}
                                    </Text>

                                    {isSelected && (
                                      <Ionicons
                                        name="checkmark"
                                        size={18}
                                        color="#16A34A"
                                      />
                                    )}
                                  </TouchableOpacity>
                                );
                              }}
                            />
                          </View>
                        </TouchableWithoutFeedback>
                      </View>
                    </TouchableWithoutFeedback>
                  </Modal>
                </>
              )}

              <TouchableOpacity
                style={[styles.confirmBtn, isInvalid && { opacity: 0.5 }]}
                disabled={isInvalid}
                onPress={() => {
                  onConfirm({
                    method: selectedMethod.id,
                    amount: Number(amount),
                    chequeNo:
                      selectedMethod.id === 'cheque' ? chequeNo : undefined,
                    clientId:
                      selectedMethod.id === 'client'
                        ? selectedClient?._id
                        : undefined,
                  });
                  resetAndClose();
                }}
              >
                <Text style={styles.confirmText}>Confirm Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep('method')}
                style={{ marginTop: 12 }}
              >
                <Text style={styles.backText}>Change Payment Method ?</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = COLORS =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    centerWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },

    confirmBtn: {
      marginTop: 20,
      backgroundColor: COLORS.primary,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
    },

    confirmText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 15,
    },

    backText: {
      textAlign: 'center',
      color: COLORS.muted,
      fontSize: 14,
    },

    modalCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: COLORS.card,
      borderRadius: 28,
      padding: 24,
      // Unified shadow style
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 10,
    },

    title: {
      fontSize: 20,
      fontWeight: '800',
      color: COLORS.text,
      textAlign: 'center',
      marginBottom: 6,
    },

    subtitle: {
      fontSize: 14,
      color: COLORS.muted,
      textAlign: 'center',
      marginBottom: 8,
    },

    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.bg, // Nested card background
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.03)',
    },

    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: COLORS.card, // Contrast against option bg
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      // Soft shadow for icon
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },

    optionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
    },

    amountInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 52,
      backgroundColor: '#FAFAFA',
      marginBottom: 12,
    },
    rupee: {
      fontSize: 18,
      fontWeight: '800',
      marginRight: 6,
      color: '#111827',
    },
    amountInput: {
      flex: 1,
      fontSize: 16,
      color: '#111827',
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 14,
      paddingHorizontal: 14,
      fontSize: 15,
      color: '#111827',
      backgroundColor: '#FAFAFA',
      marginBottom: 12,
    },
    selectBox: {
      height: 52,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 14,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: '#FAFAFA',
      marginBottom: 12,
    },
    text: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
    },

    placeholder: {
      fontSize: 15,
      color: '#9CA3AF',
    },
    pickerBox: {
      width: '85%',
      maxHeight: '65%',
      backgroundColor: '#fff',
      borderRadius: 20,
      paddingVertical: 10,
      elevation: 10,
    },

    pickerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 12,
    },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginHorizontal: 14,
      marginBottom: 10,
      backgroundColor: '#FAFAFA',
    },

    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14.5,
      color: '#111827',
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },

    optionActive: {
      backgroundColor: '#F0FDF4',
    },

    optionTextActive: {
      fontWeight: '700',
    },

    emptyText: {
      textAlign: 'center',
      paddingVertical: 20,
      color: '#9CA3AF',
      fontSize: 14,
    },
  });
