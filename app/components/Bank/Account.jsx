/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  TouchableWithoutFeedback,
  Switch,
  RefreshControl,
  LayoutAnimation,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import Navbar from '../Navbar';
import BottomNav from '../BottomNav';

const SkeletonCard = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1300,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300], // ✅ FULL CARD WIDTH
  });

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImg} />

      <View style={{ flex: 1 }}>
        <View style={styles.skeletonLineLg} />
        <View style={styles.skeletonLineMd} />
        <View style={styles.skeletonLineSm} />
      </View>

      {/* ✅ FULL WIDTH SHIMMER OVERLAY */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const Account = ({ navigation }) => {
  const [accounts, setAccounts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const slideAnim = useRef(new Animated.Value(220)).current;

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [accountTypePicker, setAccountTypePicker] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingResetFunc, setPendingResetFunc] = useState(null);

  const safeArray = v => (Array.isArray(v) ? v : []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setAccounts([]); // 🔥 drop local cache
    });

    return unsubscribe;
  }, [navigation]);

  /* ---------------- LOAD ---------------- */
  const loadAccounts = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.getAllAccounts();
      setAccounts(res.accounts || res);
    } catch (e) {
      console.log(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, []);

  /* ---------------- MODAL ---------------- */
  const openModal = () => {
    slideAnim.setValue(220);
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 220,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      resetForm();
      setModalVisible(false);
    });
  };

  const resetForm = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountType('');
    setBankName('');
    setAccountNumber('');
    setOpeningBalance('');
    setIsActive(true);
  };

  const openConfirm = useCallback((id, resetFunc) => {
    setPendingDeleteId(id);
    setPendingResetFunc(resetFunc);
    setConfirmVisible(true);
  }, []);

  /* ---------------- SAVE ---------------- */
  const handleSubmit = async () => {
    const payload = {
      accountName,
      accountType,
      bankName,
      accountNumber,
      isActive,
    };

    try {
      if (editingAccount) {
        const res = await api.updateAccount(editingAccount._id, payload);

        setAccounts(prev =>
          prev.map(acc =>
            acc._id === editingAccount._id
              ? { ...acc, ...res.account } // 🔥 local merge
              : acc,
          ),
        );
      } else {
        const res = await api.createAccount(payload);
        setAccounts(prev => [res.account, ...prev]);
      }

      closeModal();
    } catch (e) {
      console.log(e.message);
    }
  };

  const handleEdit = item => {
    setEditingAccount(item);
    setAccountName(item.accountName);
    setAccountType(item.accountType);
    setBankName(item.bankName);
    setAccountNumber(item.accountNumber);
    setOpeningBalance(String(item.openingBalance));
    setIsActive(item.isActive);
    openModal();
  };

  const handleDelete = async id => {
    await api.deleteAccount(id);
    setAccounts(prev => prev.filter(a => a._id !== id));
  };

  const openSearch = () => {
    setShowSearch(true);
    Animated.timing(searchAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      searchInputRef.current?.focus();
    });
  };

  const closeSearch = () => {
    Animated.timing(searchAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowSearch(false);
      setSearch('');
    });
  };

  useEffect(() => {
    slideAnim.setValue(200);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400); // ✅ 400ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  const filteredAccounts = safeArray(accounts)?.filter(item =>
    item.accountName.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <Navbar title="Accounts" onSearch={openSearch} />

      {showSearch && (
        <Animated.View
          style={[
            styles.searchBar,
            {
              transform: [
                {
                  translateY: searchAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              opacity: searchAnim,
            },
          ]}
        >
          <Icon name="search-outline" size={18} color="#6B7280" />

          <TextInput
            ref={searchInputRef}
            placeholder="Search product..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity onPress={closeSearch}>
            <Icon name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {refreshing && accounts.length === 0 ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredAccounts}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadAccounts} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="file-tray-outline" size={44} color="#9CA3AF" />
              <Text style={styles.emptyText}>No Data Found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AccountCard
              item={item}
              onEdit={handleEdit}
              openConfirm={openConfirm}
            />
          )}
        />
      )}

      {/* FAB */}
      {/* <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity> */}

      {/* ✅ CUSTOM DELETE CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <Animated.View style={styles.confirmBox}>
            <Icon name="trash-outline" size={42} color="#DC2626" />

            <Text style={styles.confirmTitle}>Delete Client?</Text>
            <Text style={styles.confirmMsg}>This action cannot be undone.</Text>

            <View style={styles.confirmRow}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => {
                  setConfirmVisible(false);
                  setPendingDeleteId(null);

                  if (pendingResetFunc) {
                    pendingResetFunc();
                    setPendingResetFunc(null);
                  }
                }}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={() => {
                  setConfirmVisible(false);

                  if (pendingResetFunc) {
                    pendingResetFunc();
                    setPendingResetFunc(null);
                  }

                  setTimeout(() => {
                    handleDelete(pendingDeleteId);
                    setPendingDeleteId(null);
                  }, 150);
                }}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.modalSheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.dragHandle} />

          <Text style={styles.modalTitle}>
            {editingAccount ? 'Edit Account' : 'New Account'}
          </Text>

          <InputWithIcon
            icon="wallet-outline"
            placeholder="Account Name"
            value={accountName}
            onChangeText={setAccountName}
          />

          <TouchableOpacity
            style={styles.inputWrapper}
            onPress={() => setAccountTypePicker(true)}
          >
            <Icon name="layers-outline" size={18} color="#6B7280" />
            <Text
              style={[
                styles.selectText,
                !accountType && styles.placeholderText,
              ]}
            >
              {accountType || 'Account Type'}
            </Text>
          </TouchableOpacity>

          <InputWithIcon
            icon="business-outline"
            placeholder="Bank Name"
            value={bankName}
            onChangeText={setBankName}
          />

          <InputWithIcon
            icon="card-outline"
            placeholder="Account Number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="numeric"
          />

          {/* Opening Balance with ₹ */}
          <View style={styles.inputWrapper}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              placeholder="Opening Balance"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              style={styles.inputInner}
              value={openingBalance}
              onChangeText={setOpeningBalance}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active Account</Text>
            <Switch value={isActive} onValueChange={setIsActive} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={{ color: '#fff' }}>
                {editingAccount ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      <Modal visible={accountTypePicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setAccountTypePicker(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerBox}>
              {['Cash', 'Bank', 'Savings', 'Credit'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={styles.pickerItem}
                  onPress={() => {
                    setAccountType(type);
                    setAccountTypePicker(false);
                  }}
                >
                  <Text style={styles.pickerText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BottomNav navigation={navigation} active="bank" />
    </View>
  );
};

export default Account;

const InputWithIcon = ({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  editable = true,
}) => (
  <View style={styles.inputWrapper}>
    <Icon name={icon} size={18} color="#6B7280" style={{ marginRight: 10 }} />

    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      style={styles.inputInner}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      editable={editable}
    />
  </View>
);

const AccountCard = ({ item, onEdit, openConfirm }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  const deleteTranslate = translateX.interpolate({
    inputRange: [-160, 0],
    outputRange: [0, 140],
    extrapolate: 'clamp',
  });

  const deleteOpacity = translateX.interpolate({
    inputRange: [-140, -60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15,

      onPanResponderMove: (_, g) => {
        if (g.dx < 0) {
          translateX.setValue(Math.max(g.dx, -140));
        }
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx < -110) {
          openConfirm(item._id, resetPosition);
          resetPosition();
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrapper}>
      {/* DELETE BG */}
      <View style={styles.deleteBg}>
        <Animated.View
          style={{
            transform: [{ translateX: deleteTranslate }],
            opacity: deleteOpacity,
          }}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.cardCollapsed, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
          {/* COLLAPSED */}
          <View style={styles.collapsedRow}>
            <View>
              <Text style={styles.title}>{item.accountName}</Text>
              <Text style={styles.subTitle}>
                {item.accountNumber || '—'} • {item?.clientId?.accountType}
              </Text>
            </View>

            <View style={styles.rightCol}>
              <View style={styles.amountChevronRow}>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                <Animated.View
                  style={{
                    transform: [{ rotate: expanded ? '180deg' : '0deg' }],
                    marginLeft: 6,
                  }}
                >
                  <Icon name="chevron-down" size={18} color="#111827" />
                </Animated.View>
              </View>
            </View>
          </View>

          {/* EXPANDED */}
          {expanded && (
            <View style={styles.expandedBox}>
              <DetailRow label="Account No" value={item.accountNumber || '—'} />
              <DetailRow
                label="Opening Balance"
                value={`₹ ${item.openingBalance}`}
              />
              <DetailRow
                label="Current Balance"
                value={`₹ ${item.currentBalance}`}
              />
              <DetailRow
                label="Status"
                value={item.isActive ? 'Active' : 'Inactive'}
              />

              <TouchableOpacity
                style={styles.editBtnBlack}
                onPress={() => onEdit(item)}
              >
                <Icon name="create-outline" size={16} color="#fff" />
                <Text style={styles.editTextWhite}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },

  swipeWrapper: {
    position: 'relative',
    marginBottom: 14,
  },

  editBtnBlack: {
    marginTop: 14,
    backgroundColor: '#111827',
    paddingVertical: 10,
    width: '100%',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center', // 🔥 center horizontally
    gap: 6,
  },

  editTextWhite: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    height: 72,
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 40,
  },

  deleteText: {
    color: '#fff',
    fontWeight: '800',
  },

  cardCollapsed: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 4,
  },

  collapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  subTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },

  balancePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  balanceText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 13,
  },

  expandedBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#F3F4F6',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },

  editBtn: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },

  editText: {
    fontWeight: '700',
    color: '#111827',
  },

  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 4,
  },

  leftCol: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },

  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  accountName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  accountMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  accountNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginVertical: 6,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },

  inputInner: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },

  placeholderText: {
    color: '#9CA3AF',
    fontSize: 15,
  },

  selectText: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 10,
    flex: 1,
  },

  currency: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
    color: '#111827',
  },

  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 3,
  },

  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardSub: { fontSize: 12, color: '#6B7280' },
  balance: { fontWeight: '700', marginBottom: 6 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  modalSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },

  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },

  actionRow: { flexDirection: 'row', gap: 12 },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  saveBtn: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  amountChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  amountText: {
    fontSize: 14,
    fontWeight: '800',
    backgroundColor: '#16A34A',
  },

  stockBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  stockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#111827',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    flexWrap: 'wrap',
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },

  filterChipActive: {
    backgroundColor: '#111827',
  },

  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  filterTextActive: {
    color: '#fff',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  /* ===================== SKELETON STYLES ===================== */

  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },

  skeletonImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    marginRight: 12,
  },

  skeletonLineLg: {
    height: 14,
    width: '60%',
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },

  skeletonLineMd: {
    height: 12,
    width: '45%',
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginBottom: 6,
  },

  skeletonLineSm: {
    height: 10,
    width: '35%',
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
  },

  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: -150,
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    elevation: 10,
  },

  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
  },

  confirmMsg: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },

  confirmRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  confirmCancel: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  confirmCancelText: {
    fontWeight: '700',
    color: '#111827',
  },

  confirmDelete: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  confirmDeleteText: {
    fontWeight: '700',
    color: '#fff',
  },

  emptyState: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 200,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#6B7280',
  },
});
