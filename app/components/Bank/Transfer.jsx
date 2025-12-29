// /* eslint-disable react-native/no-inline-styles */
// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   Modal,
// } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import api from '../../services/api';
// import Loading from '../../animation/Loading';
// import Navbar from '../Navbar';

// export default function Transfer({ navigation }) {
//   const [accounts, setAccounts] = useState([]);
//   const [fromAccount, setFromAccount] = useState(null);
//   const [toAccount, setToAccount] = useState(null);
//   const [amount, setAmount] = useState('');
//   const [note, setNote] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [pickerType, setPickerType] = useState(null);

//   useEffect(() => {
//     loadAccounts();
//   }, []);

//   const loadAccounts = async () => {
//     const res = await api.getAllAccounts();
//     setAccounts(res || []);
//   };

//   const submitTransfer = async () => {
//     if (!fromAccount || !toAccount || !amount) return;

//     if (fromAccount._id === toAccount._id) {
//       alert('Cannot transfer to same account');
//       return;
//     }

//     try {
//       setLoading(true);
//       await api.transferAmount({
//         fromAccountId: fromAccount._id,
//         toAccountId: toAccount._id,
//         amount: Number(amount),
//         narration: note,
//       });

//       navigation.goBack();
//     } catch (e) {
//       alert(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Navbar title="Transfer Money" />

//       <View style={styles.card}>
//         {/* FROM */}
//         <PickerRow
//           label="From Account"
//           value={fromAccount?.accountName}
//           onPress={() => setPickerType('from')}
//         />

//         {/* TO */}
//         <PickerRow
//           label="To Account"
//           value={toAccount?.accountName}
//           onPress={() => setPickerType('to')}
//         />

//         {/* AMOUNT */}
//         <View style={styles.inputBox}>
//           <Text style={styles.currency}>₹</Text>
//           <TextInput
//             placeholder="Enter amount"
//             keyboardType="numeric"
//             value={amount}
//             onChangeText={setAmount}
//             style={styles.input}
//           />
//         </View>

//         {/* NOTE */}
//         <TextInput
//           placeholder="Narration (optional)"
//           value={note}
//           onChangeText={setNote}
//           style={styles.note}
//         />

//         <TouchableOpacity style={styles.transferBtn} onPress={submitTransfer}>
//           <Ionicons name="swap-horizontal" size={18} color="#fff" />
//           <Text style={styles.transferText}>Transfer</Text>
//         </TouchableOpacity>
//       </View>

//       {/* PICKER */}
//       <Modal visible={!!pickerType} transparent animationType="fade">
//         <View style={styles.overlay}>
//           <View style={styles.pickerBox}>
//             <Text style={styles.pickerTitle}>
//               Select {pickerType === 'from' ? 'From' : 'To'} Account
//             </Text>

//             {accounts.map(acc => (
//               <TouchableOpacity
//                 key={acc._id}
//                 style={styles.pickerItem}
//                 onPress={() => {
//                   pickerType === 'from'
//                     ? setFromAccount(acc)
//                     : setToAccount(acc);
//                   setPickerType(null);
//                 }}
//               >
//                 <Text style={styles.pickerText}>{acc.accountName}</Text>
//                 <Text style={styles.balance}>₹ {acc.currentBalance}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </View>
//       </Modal>

//       {loading && (
//         <Modal transparent>
//           <View style={styles.loaderOverlay}>
//             <Loading />
//           </View>
//         </Modal>
//       )}
//     </View>
//   );
// }

// /* ---------------- UI COMPONENTS ---------------- */

// const PickerRow = ({ label, value, onPress }) => (
//   <TouchableOpacity style={styles.row} onPress={onPress}>
//     <Text style={styles.label}>{label}</Text>
//     <View style={styles.rowRight}>
//       <Text style={styles.value}>{value || 'Select'}</Text>
//       <Ionicons name="chevron-down" size={16} />
//     </View>
//   </TouchableOpacity>
// );

// /* ---------------- STYLES ---------------- */

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#F9FAFB' },

//   card: {
//     margin: 16,
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 16,
//     elevation: 4,
//   },

//   row: {
//     borderBottomWidth: 1,
//     borderColor: '#E5E7EB',
//     paddingVertical: 14,
//   },

//   label: { fontSize: 12, color: '#6B7280' },
//   rowRight: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   value: { fontSize: 15, fontWeight: '700' },

//   inputBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F3F4F6',
//     borderRadius: 14,
//     padding: 14,
//     marginTop: 16,
//   },

//   currency: { fontSize: 20, fontWeight: '800', marginRight: 8 },
//   input: { flex: 1, fontSize: 16 },

//   note: {
//     backgroundColor: '#F3F4F6',
//     borderRadius: 14,
//     padding: 14,
//     marginTop: 12,
//   },

//   transferBtn: {
//     backgroundColor: '#111827',
//     borderRadius: 16,
//     paddingVertical: 14,
//     alignItems: 'center',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 8,
//     marginTop: 24,
//   },

//   transferText: { color: '#fff', fontWeight: '800' },

//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'center',
//     padding: 20,
//   },

//   pickerBox: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 16,
//   },

//   pickerTitle: {
//     fontSize: 16,
//     fontWeight: '800',
//     marginBottom: 10,
//   },

//   pickerItem: {
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderColor: '#F3F4F6',
//   },

//   pickerText: { fontWeight: '700' },
//   balance: { fontSize: 12, color: '#6B7280' },

//   loaderOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Navbar from '../Navbar';
import api from '../../services/api';
import Loading from '../../animation/Loading';

const { width } = Dimensions.get('window');

export default function TransferStatisticsLight({ navigation }) {
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount] = useState(null);
  const [amount, setAmount] = useState(0);
  const [pickerType, setPickerType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [transferHistory, setTransferHistory] = useState([]);

  const fromAnim = useRef(new Animated.Value(0)).current;
  const toAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const res = await api.getAllAccounts();
    setAccounts(res || []);
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await api.transferAmountHistory();
      setTransferHistory(res || []);
    } catch (e) {
      console.log(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [fromAccount]);

  console.log(transferHistory);

  const submitTransfer = async () => {
    if (!fromAccount || !toAccount || !amount) return;

    if (fromAccount._id === toAccount._id) {
      Alert.alert('Cannot transfer to same account');
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

      setAmount(0);
      setPickerType(null);
      setFromAccount(null);
      setToAccount(null);
    } catch (e) {
      Alert.alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const swapAccounts = () => {
    Animated.parallel([
      Animated.timing(fromAnim, {
        toValue: -40,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(toAnim, {
        toValue: 40,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 🔁 swap data AFTER animation
      setFromAccount(toAccount);
      setToAccount(fromAccount);

      // reset animation
      fromAnim.setValue(40);
      toAnim.setValue(-40);

      Animated.parallel([
        Animated.timing(fromAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Navbar title="Transfer" page="transfer" />

      <View style={styles.safe}>
        <View style={styles.transferStack}>
          <Animated.View
            style={{
              transform: [{ translateY: fromAnim }],
              opacity: fromAnim.interpolate({
                inputRange: [-40, 0, 40],
                outputRange: [0.6, 1, 0.6],
              }),
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.accountLabel}>From Account</Text>
                  <Text
                    style={styles.accountName}
                    onPress={() => setPickerType('from')}
                  >
                    {fromAccount ? fromAccount.accountName : 'Select Account'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.sendBtn}>
                  <Text style={styles.sendText}>From</Text>
                </TouchableOpacity>
              </View>

              {/* AMOUNT INPUT */}
              <View style={styles.amountInputRow}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#111"
                  keyboardType="numeric"
                  style={styles.amountInput}
                />
              </View>

              <Text style={styles.balance}>
                Balance: ₹ {fromAccount?.currentBalance ?? '--'}
              </Text>
            </View>
          </Animated.View>

          {/* SWAP BUTTON */}
          <View style={styles.swapWrapper}>
            <TouchableOpacity style={styles.swapBtn} onPress={swapAccounts}>
              <Ionicons name="swap-vertical" size={25} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading && (
            <Modal transparent>
              <View style={styles.loaderOverlay}>
                <Loading />
              </View>
            </Modal>
          )}

          <Animated.View
            style={{
              transform: [{ translateY: toAnim }],
              opacity: toAnim.interpolate({
                inputRange: [-40, 0, 40],
                outputRange: [0.6, 1, 0.6],
              }),
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.accountLabel}>To Account</Text>
                  <Text
                    style={styles.accountName}
                    onPress={() => setPickerType('to')}
                  >
                    {toAccount ? toAccount.accountName : 'Select Account'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.receiveBtn}>
                  <Text style={styles.receiveText}>To</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.balanceWrapper}>
                <Text style={styles.balance}>
                  Balance: ₹ {toAccount?.currentBalance ?? '--'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => setConfirmVisible(true)}
        >
          <Text style={styles.ctaText}>Transfer ₹ {amount || 0}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={transferHistory}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isDebit = item.entryType === 'debit';

          return (
            <View style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <View
                  style={[
                    styles.historyIcon,
                    { backgroundColor: isDebit ? '#FEE2E2' : '#DCFCE7' },
                  ]}
                >
                  <Ionicons
                    name={isDebit ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={isDebit ? '#DC2626' : '#16A34A'}
                  />
                </View>

                <View>
                  <Text style={styles.historyTitle}>
                    {isDebit ? 'Transfer Sent' : 'Transfer Received'}
                  </Text>

                  <Text style={styles.historySub}>
                    {item.accountId?.accountName}
                  </Text>

                  <Text style={styles.historyDate}>
                    {new Date(item.date).toLocaleString()}
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

      <Modal visible={!!pickerType} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setPickerType(null)}>
          <View style={styles.overlay}>
            {/* Stop propagation */}
            <TouchableWithoutFeedback>
              <View style={styles.pickerBox}>
                <Text style={styles.pickerTitle}>
                  Select {pickerType === 'from' ? 'From' : 'To'} Account
                </Text>

                <FlatList
                  data={accounts}
                  keyExtractor={i => i._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => {
                        pickerType === 'from'
                          ? setFromAccount(item)
                          : setToAccount(item);
                        setPickerType(null);
                      }}
                    >
                      <View>
                        <Text style={styles.pickerText}>
                          {item.accountName}
                        </Text>
                        <Text style={styles.balanceSmall}>
                          Balance: ₹ {item.currentBalance}
                        </Text>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Confirm Transfer</Text>

            <View style={styles.confirmRow}>
              <Text>From</Text>
              <Text style={styles.bold}>{fromAccount?.accountName}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text>To</Text>
              <Text style={styles.bold}>{toAccount?.accountName}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text>Amount</Text>
              <Text style={styles.bold}>₹ {amount}</Text>
            </View>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  setConfirmVisible(false);
                  submitTransfer();
                }}
              >
                <Text style={{ color: '#fff' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  safe: {
    padding: 20,
  },

  balanceSmall: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },

  historyLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  historyTitle: {
    fontWeight: '800',
    fontSize: 14,
    color: '#111827',
  },

  historySub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  historyDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  historyAmount: {
    fontSize: 14,
    fontWeight: '900',
  },

  pickerItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  historyRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },

  balanceWrapper: {
    marginTop: 16,
  },

  confirmBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },

  historyItem: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },

  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },

  bold: {
    fontWeight: '800',
  },

  confirmActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },

  confirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },

  swapWrapper: {
    position: 'absolute',
    top: '36%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },

  transferStack: {
    position: 'relative',
  },

  swapBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',

    // premium floating feel
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  accountLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },

  accountName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  currency: {
    fontSize: 28,
    fontWeight: '900',
    marginRight: 6,
    color: '#111827',
  },

  amountInput: {
    flex: 1,
    fontSize: 34,
    fontWeight: '900',
    color: '#111827',
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    height: 160,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  currencyRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  currencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4338CA',
  },

  currencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  rate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  sendBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  sendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  receiveBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },

  receiveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  amount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#111827',
    marginTop: 16,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },

  balance: {
    fontSize: 13,
    color: '#6B7280',
  },

  maxChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  maxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
  },

  /* CTA */
  cta: {
    backgroundColor: '#2563EB',
    paddingVertical: 18,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 10,
  },

  ctaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  pickerBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },

  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },

  pickerText: { fontWeight: '700' },

  loaderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
