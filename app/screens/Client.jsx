/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
  ScrollView,
  RefreshControl,
  LayoutAnimation,
  Switch,
  Alert,
} from 'react-native';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Icon from 'react-native-vector-icons/Ionicons';
import Loading from '../animation/Loading';
import api from '../services/api';
import {
  clearClientCache,
  getClientsFromCache,
  saveClientsToCache,
  SYSTEM_ACCOUNTS,
} from '../services/statics';
import { pick } from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import ImportCsv from '../utility/ImportCsv';

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

const Client = ({ navigation }) => {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [errors, setErrors] = useState({});
  const slideAnim = useRef(new Animated.Value(200)).current;
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  const [clientName, setClientName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [address, setAddress] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [pendingFromOurs, setPendingFromOurs] = useState('');
  const [accountType, setAccountType] = useState('');
  const [isEmployee, setIsEmployee] = useState(false);
  const [salary, setSalary] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingResetFunc, setPendingResetFunc] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importErrors, setImportErrors] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    slideAnim.setValue(200);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400); // ✅ 400ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  const filteredClients = clients?.filter(
    i =>
      i.clientName &&
      i.clientName.toLowerCase().includes(debouncedSearch.toLowerCase()) &&
      !SYSTEM_ACCOUNTS.includes(i.clientName.toLowerCase()),
  );

  const pickCSVFile = async () => {
    try {
      const results = await pick({
        type: ['text/plain', 'text/csv', '*/*'],
        allowMultiSelection: false,
      });

      if (!results || !results.length) {
        Alert.alert('No file selected');
        return;
      }

      const res = results[0];

      console.log('PICK RESULT:', res);

      // ✅ READ DIRECTLY FROM content:// USING blob-util
      const csvText = await RNBlobUtil.fs.readFile(res.uri, 'utf8');

      if (!csvText || !csvText.trim()) {
        Alert.alert('CSV file is empty');
        return;
      }

      setCsvText(csvText);
      setCsvModalVisible(true);
    } catch (err) {
      if (
        err?.code === 'DOCUMENT_PICKER_CANCELED' ||
        err?.message?.includes('cancel')
      ) {
        return;
      }

      console.log('CSV PICK ERROR:', err);
      Alert.alert('Failed to pick CSV file');
    }
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

  const openModal = () => {
    handleReset();
    slideAnim.setValue(220);
    setModalVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setClientName('');
      setPhoneNo('');
      setGstNo('');
      setAddress('');
      setPendingAmount('');
      setPaidAmount('');
      setPendingFromOurs('');
      setAccountType('');
      setIsEmployee(false);
      setSalary('');
      setEditingClient(null);
      setErrors({});
      setModalVisible(false);
    });
  };

  const handleReset = () => {
    setEditingClient(null);
    setClientName('');
    setPhoneNo('');
    setGstNo('');
    setAddress('');
    setPendingAmount('');
    setPaidAmount('');
    setPendingFromOurs('');
    setAccountType('');
    setIsEmployee(false);
    setSalary('');
    setErrors({});
    closeModal();
  };

  const handleSubmit = async () => {
    let newErrors = {};
    if (!clientName.trim()) newErrors.clientName = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const clientData = {
      clientName: clientName.trim().toUpperCase(),
      phoneNo: Number(phoneNo),
      gstNo: gstNo,
      address: address.trim(),
      pendingAmount: Number(pendingAmount),
      paidAmount: Number(paidAmount),
      pendingFromOurs: Number(pendingFromOurs),
      accountType: accountType.trim(),
      isEmployee,
      salary: Number(salary),
    };

    if (editingClient) {
      try {
        setLoading(true);
        const res = await api.updateClient(editingClient._id, clientData);

        const updated = res.client;

        setClients(prev =>
          prev.map(c => (c._id === updated._id ? updated : c)),
        );

        saveClientsToCache(clients);

        handleReset();
      } catch (err) {
        console.log('Update error:', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const res = await api.createClient(clientData);

        setClients(prev => {
          const updated = [res.client, ...prev];
          saveClientsToCache(updated);
          return updated;
        });

        handleReset();
      } catch (err) {
        console.log('Update error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    closeModal();
  };

  const handleDelete = async id => {
    const previous = clients;

    setClients(prev => {
      const updated = prev.filter(c => c._id !== id);
      saveClientsToCache(updated);
      return updated;
    });

    try {
      await api.deleteClient(id);
    } catch (err) {
      // rollback if API fails
      setClients(previous);
      saveClientsToCache(previous);
      Alert.alert('Delete failed');
    }
  };

  const handleEdit = item => {
    setEditingClient(item);

    setClientName(item.clientName || '');
    setPhoneNo(item.phoneNo?.toString() || '');
    setGstNo(item.gstNo?.toString() || '');
    setAddress(item.address || '');
    setPendingAmount(item.pendingAmount?.toString() || '');
    setPaidAmount(item.paidAmount?.toString() || '');
    setPendingFromOurs(item.pendingFromOurs?.toString() || '');
    setAccountType(item.accountType || '');
    setIsEmployee(item.isEmployee || '');
    setSalary(item.salary?.toString() || '');

    slideAnim.setValue(220);
    setModalVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const loadClients = useCallback(async () => {
    try {
      setRefreshing(true);
      setLoading(true);
      const res = await api.getAllClients();
      setClients(res);

      await saveClientsToCache(res);
    } catch (err) {
      const cached = await getClientsFromCache();
      if (cached) {
        setClients(cached);
      }
      console.log('Fetch error:', err.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [refreshing]);

  useEffect(() => {
    loadClients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await clearClientCache();
    await loadClients();
  };

  const openConfirm = useCallback((id, resetFunc) => {
    setPendingDeleteId(id);
    setPendingResetFunc(resetFunc);
    setConfirmVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <Navbar title="Clients" onSearch={openSearch} />

      {/* ✅ SEARCH BAR */}
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

      {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      {/* ✅ PRODUCT LIST */}
      {loading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          keyExtractor={item => item._id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <SwipeCard
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              openConfirm={openConfirm}
              navigation={navigation}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="cube-outline" size={44} color="#9CA3AF" />
              <Text style={styles.emptyText}>No Data Found</Text>
            </View>
          }
        />
      )}

      {/* ✅ FAB */}
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Icon name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, { bottom: 160, backgroundColor: '#2563EB' }]}
        onPress={pickCSVFile}
      >
        <Icon name="cloud-upload-outline" size={26} color="#fff" />
      </TouchableOpacity>

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

      <ImportCsv
        csvModalVisible={csvModalVisible}
        setCsvModalVisible={setCsvModalVisible}
        loadClients={loadClients}
        csvText={csvText}
      />

      {/* ✅ MODAL */}
      <Modal visible={modalVisible} transparent animationType="none">
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
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

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* ✅ SCROLLABLE FORM CONTENT */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScroll}
            >
              {/* ✅ CLIENT NAME */}
              <TextInput
                placeholder="Client Name"
                placeholderTextColor="#9CA3AF"
                value={String(clientName).toUpperCase()}
                onChangeText={setClientName}
                style={[styles.input, errors.name && styles.errorInput]}
              />

              {/* ✅ PHONE + GST */}
              <View style={styles.row2}>
                <TextInput
                  placeholder="Phone No"
                  placeholderTextColor="#9CA3AF"
                  value={phoneNo}
                  onChangeText={setPhoneNo}
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />

                <TextInput
                  placeholder="GST No"
                  placeholderTextColor="#9CA3AF"
                  value={String(gstNo).toUpperCase()}
                  onChangeText={setGstNo}
                  style={styles.inputHalf}
                />
              </View>

              {/* ✅ ADDRESS (TEXTAREA) */}
              <TextInput
                placeholder="Client Address"
                placeholderTextColor="#9CA3AF"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              />

              {/* ✅ AMOUNTS */}
              <View style={styles.row2}>
                <TextInput
                  placeholder="Pending Amount"
                  placeholderTextColor="#9CA3AF"
                  value={pendingAmount}
                  onChangeText={setPendingAmount}
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />

                <TextInput
                  placeholder="Paid Amount"
                  placeholderTextColor="#9CA3AF"
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />
              </View>

              <TextInput
                placeholder="Pending From Ours"
                placeholderTextColor="#9CA3AF"
                value={pendingFromOurs}
                onChangeText={setPendingFromOurs}
                keyboardType="numeric"
                style={styles.input}
              />

              {/* ✅ ACCOUNT TYPE PICKER */}
              <TouchableOpacity
                style={styles.selectHalf}
                onPress={() => {
                  setPickerType('accountType');
                  setPickerVisible(true);
                }}
              >
                <Text
                  style={accountType ? styles.selectText : styles.placeholder}
                >
                  {accountType || 'Select Account Type'}
                </Text>
              </TouchableOpacity>

              {/* ✅ IS EMPLOYEE TOGGLE */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Is Employee?</Text>
                <Switch
                  value={isEmployee}
                  onValueChange={setIsEmployee}
                  thumbColor={isEmployee ? '#22C55E' : '#9CA3AF'}
                />
              </View>

              {/* ✅ SALARY (ONLY IF EMPLOYEE) */}
              {isEmployee && (
                <View style={{ marginBottom: 20 }}>
                  <View style={styles.priceHalf}>
                    <Text style={styles.currency}>₹</Text>
                    <TextInput
                      placeholder="Salary"
                      placeholderTextColor="#9CA3AF"
                      value={salary}
                      onChangeText={setSalary}
                      keyboardType="numeric"
                      style={styles.priceHalfInput}
                    />
                  </View>
                </View>
              )}

              {/* ✅ ACTION BUTTONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                  <Text style={styles.saveText}>
                    {editingClient ? 'Update' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerBox}>
              {['Creditor', 'Debtor'].map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    setAccountType(item);
                    setPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickerText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ✅ BOTTOM NAV */}
      <BottomNav navigation={navigation} active="client" />
    </View>
  );
};

export default Client;

/* ========================================================= */
/* ===================== SWIPE CARD ======================== */
/* ========================================================= */

const SwipeCard = ({ item, onDelete, onEdit, openConfirm, navigation }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
  };

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
          translateX.setValue(Math.max(g.dx, -160));
        }
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx < -110) {
          Animated.spring(translateX, {
            toValue: -140,
            speed: 20,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          openConfirm(item._id, resetPosition);
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeWrapper}>
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
        style={[styles.productCardCollapsed, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleExpand}
          style={{ flex: 1 }}
        >
          {/* ✅ COLLAPSED VIEW */}
          <View style={styles.collapsedRow}>
            <View>
              <Text numberOfLines={1} style={styles.productTitle}>
                {item.clientName}
              </Text>
              <Text style={styles.assetType}>
                {item.accountType} [ {item.gstNo} ]
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>
                  Pending: {item.pendingAmount || 0}
                </Text>
              </View>

              <TouchableOpacity
                onPress={toggleExpand}
                activeOpacity={0.7}
                style={styles.arrowBtn}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: expanded ? '180deg' : '0deg',
                      },
                    ],
                  }}
                >
                  <Icon name="chevron-down" size={16} color="#111827" />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ✅ EXPANDED VIEW */}
          {expanded && (
            <View style={styles.expandedBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pending Amount</Text>
                <Text style={styles.detailValue}>
                  ₹ {item.pendingAmount || 0}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Paid Amount</Text>
                <Text style={styles.detailValue}>₹ {item.paidAmount || 0}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pending From Ours</Text>
                <Text style={styles.detailValue}>
                  ₹ {item.pendingFromOurs || 0}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Type</Text>
                <Text style={styles.detailValue}>{item.accountType}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{item.address}</Text>
              </View>

              {item.isEmployee && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Salary</Text>
                  <Text style={styles.detailValue}>{item.salary}</Text>
                </View>
              )}

              <View style={styles.totalDivider} />

              <View style={styles.editBtnContainer}>
                <TouchableOpacity
                  style={styles.editBtnExpanded}
                  onPress={() => onEdit(item)}
                >
                  <Icon name="create-outline" size={18} color="#ffffffff" />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtnExpanded}
                  onPress={() =>
                    navigation.navigate('Ledger', {
                      client: item,
                    })
                  }
                >
                  <Icon name="unlink-outline" size={18} color="#ffffffff" />
                  <Text style={styles.editText}>Ledger</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

/* ========================================================= */
/* ========================= STYLES ======================== */
/* ========================================================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },

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

  swipeWrapper: {
    position: 'relative',
  },

  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%', // ✅ full width but clipped
    height: 78,
    backgroundColor: '#DC2626',
    borderRadius: 18,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 50,
    overflow: 'hidden', // ✅ THIS HIDES IT UNTIL SWIPE
  },

  deleteText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#111827',
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

  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  imageBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoBox: {
    flex: 1,
  },

  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
    marginVertical: 2,
  },

  productQty: {
    fontSize: 12,
    color: '#6B7280',
  },

  actionBox: {
    flexDirection: 'row',
    gap: 10,
  },

  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
  },

  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
    backgroundColor: '#FAFAFA',
  },

  currency: {
    fontSize: 18,
    marginRight: 6,
    color: '#111',
    fontWeight: '700',
  },

  priceInput: {
    flex: 1,
    fontSize: 16,
    color: '#111',
  },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
  },

  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qtyText: {
    fontSize: 16,
    fontWeight: '700',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  cancelText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },

  saveBtn: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  errorInput: {
    borderColor: '#EF4444',
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

  selectInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    marginBottom: 14,
  },

  placeholder: {
    color: '#9CA3AF',
    fontSize: 15,
  },

  selectText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },

  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickerBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 20,
    paddingVertical: 12,
  },

  pickerItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },

  pickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  modalScroll: {
    paddingBottom: 20,
  },

  row2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111',
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },

  inputHalf: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#111',
  },

  selectHalf: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },

  priceHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FAFAFA',
    height: 52,
  },

  priceHalfInput: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    marginLeft: 6,
  },

  qtyHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: '#FAFAFA',
  },

  totalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },

  totalGrandLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
  },

  totalGrandValue: {
    fontSize: 17,
    color: '#16A34A',
    fontWeight: '900',
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

  productCardCollapsed: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  collapsedRow: {
    flexDirection: 'row',
    height: 46,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  productTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  assetType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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

  expandedBox: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  detailValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },

  totalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#22C55E',
  },

  editBtnExpanded: {
    flex: 1, // 🔥 equal width
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  editText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  editBtnSecondary: {
    backgroundColor: '#1F2937', // slightly lighter black
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
  },

  toggleLabel: {
    fontSize: 15,
    marginHorizontal: 10,
    fontWeight: '600',
    color: '#111827',
  },

  /* ===================== NEW PRODUCT LIST UI ===================== */

  productCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  productIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  productInfo: {
    flex: 1,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  priceBadge: {
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },

  editBtnNew: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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

  editBtnContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
});
