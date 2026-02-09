/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
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
  Switch,
  Alert,
  Platform,
} from 'react-native';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Loading from '../animation/Loading';
import PaymentModal from '../utility/PaymentModal';
import AccountSelectionModal from '../utility/AccountSelectionModal';
import { SYSTEM_ACCOUNTS } from '../services/statics';
import Cash from '../../assets/cash.svg';
import Gpay from '../../assets/googlepay.svg';
import Idbi from '../../assets/IDBIBank.svg';

const getTextValue = val => {
  if (typeof val === 'string' || typeof val === 'number') {
    return String(val);
  }
  if (val && typeof val === 'object') {
    return val.name || val.label || val.clientName || val.productName || '';
  }
  return '';
};

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

const StatsSkeleton = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.statTile, styles.statSkeleton]}>
          <View style={styles.statSkeletonLabel} />
          <View style={styles.statSkeletonValue} />

          <Animated.View
            pointerEvents="none"
            style={[styles.statShimmer, { transform: [{ translateX }] }]}
          />
        </View>
      ))}
    </View>
  );
};

const Purchase = ({ navigation }) => {
  const scrollRef = useRef(null);
  const fieldPositions = useRef({});
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [errors, setErrors] = useState({});
  const slideAnim = useRef(new Animated.Value(200)).current;
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  const [clientId, setClientId] = useState(null);
  const [clientName, setClientName] = useState('');

  const [productId, setProductId] = useState(null);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');

  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  const [taxRate, setTaxRate] = useState('');
  const [freightCharges, setFreightCharges] = useState('');
  const [freightTax, setFreightTax] = useState('');

  const [status, setStatus] = useState('pending');
  const [isPartial, setIsPartial] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [paymentMethod, setPaymentMethod] = useState('Bank');

  const [paidAmount, setPaidAmount] = useState('');
  const [pendingAmount, setPendingAmount] = useState('');
  const [pendingFromOurs, setPendingFromOurs] = useState('');
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [billNo, setBillNo] = useState('');
  const [description, setDescription] = useState('');

  const [pickerType, setPickerType] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const [refreshing, setRefreshing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingResetFunc, setPendingResetFunc] = useState(null);

  const [selectedProductStock, setSelectedProductStock] = useState(0);
  const [stockError, setStockError] = useState('');

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  const [filterVisible, setFilterVisible] = useState(false);
  const filterAnim = useRef(new Animated.Value(300)).current;

  const [filterClientId, setFilterClientId] = useState(null);
  const [filterClientName, setFilterClientName] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const [appliedFilters, setAppliedFilters] = useState(null);

  const [accountModalVisible, setAccountModalVisible] = useState(false);

  const [accounts, setAccounts] = useState([]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [totalAmount, setTotalAmount] = useState();
  const [paymentList, setPaymentList] = useState([]);

  const PICKER_PAGE_SIZE = 20;

  const [pickerData, setPickerData] = useState([]);
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerHasMore, setPickerHasMore] = useState(true);
  const [pickerLoading, setPickerLoading] = useState(false);

  const normalizeArray = data => (Array.isArray(data) ? data : []);

  useEffect(() => {
    slideAnim.setValue(200);
  }, []);

  const registerField = name => ({
    onLayout: e => {
      fieldPositions.current[name] = e.nativeEvent.layout.y;
    },
  });

  useEffect(() => {
    if (!pickerVisible || !pickerType) return;

    setPickerPage(1);
    setPickerHasMore(true);
    setPickerData([]);

    const timeout = setTimeout(() => {
      loadPickerData({ reset: true });
    }, 300); // debounce search

    return () => clearTimeout(timeout);
  }, [pickerType, pickerSearch]);

  const loadPickerData = async ({ reset = false } = {}) => {
    if (pickerLoading) return;
    if (!pickerHasMore && !reset) return;

    try {
      setPickerLoading(true);

      const page = reset ? 1 : pickerPage;
      if (reset) {
        setPickerPage(1);
      }

      let res;

      if (pickerType === 'product' || pickerType === 'filterProduct') {
        res = await api.getAllProducts({
          page,
          limit: PICKER_PAGE_SIZE,
          search: pickerSearch,
        });
      }

      if (pickerType === 'client' || pickerType === 'filterClient') {
        res = await api.getAllClients({
          page,
          limit: PICKER_PAGE_SIZE,
          search: pickerSearch,
        });
      }

      if (pickerType === 'tax') {
        setPickerData(['5', '12', '18', '28']);
        setPickerHasMore(false);
        return;
      }

      let list = res?.products || res?.clients || [];

      /* 🚫 REMOVE SYSTEM ACCOUNTS (CLIENT PICKER ONLY) */
      if (pickerType === 'client' || pickerType === 'filterClient') {
        list = list.filter(
          i =>
            i?.clientName &&
            !SYSTEM_ACCOUNTS.includes(i.clientName.toLowerCase()),
        );
      }

      setPickerData(prev => {
        const combined = reset ? list : [...prev, ...list];

        const uniqueMap = new Map();
        combined.forEach(item => {
          if (item?._id) {
            uniqueMap.set(item._id, item);
          }
        });

        return Array.from(uniqueMap.values());
      });

      if (list.length < PICKER_PAGE_SIZE) {
        setPickerHasMore(false);
      } else {
        setPickerPage(page + 1);
      }
    } catch (err) {
      console.log('Picker pagination error:', err.message);
    } finally {
      setPickerLoading(false);
    }
  };

  useEffect(() => {
    if (!pickerVisible) setPickerSearch('');
  }, [pickerVisible]);

  const scrollToError = fieldName => {
    const y = fieldPositions.current[fieldName];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({
        y: Math.max(y - 40, 0), // offset for header
        animated: true,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400); // ✅ 400ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  // useEffect(() => {
  //   api.getAllAccounts().then(res => {
  //     setAccounts(res.accounts || res);
  //   });
  // }, []);

  // Calculate totals dynamically
  const subTotal = Number(purchasePrice || 0) * Number(quantity || 0);
  const taxAmountCalc = (subTotal * Number(taxRate || 0)) / 100;
  const freightTaxAmountCalc =
    (Number(freightCharges || 0) * Number(freightTax || 0)) / 100;
  const totalWithTax =
    subTotal +
    taxAmountCalc +
    Number(freightCharges || 0) +
    freightTaxAmountCalc;
  const pendingCalc =
    paymentType === 'partial'
      ? Math.max(0, totalWithTax - Number(paidAmount || 0))
      : status === 'completed'
      ? 0
      : totalWithTax;

  useEffect(() => {
    setPendingAmount(pendingCalc.toFixed(2));
  }, [totalWithTax, paidAmount, paymentType, status]);

  const filteredPurchases = purchases.filter(item => {
    const searchText = debouncedSearch.toLowerCase();

    const clientNameDb = item?.clientId?.clientName?.toLowerCase() || '';
    const productNameDb = item?.productId?.productName?.toLowerCase() || '';
    const billNoDb = item?.billNo?.toLowerCase() || '';

    const searchMatch =
      clientNameDb.includes(searchText) ||
      productNameDb.includes(searchText) ||
      billNoDb.includes(searchText);

    if (!searchMatch) return false;

    if (!appliedFilters) return true;

    if (
      appliedFilters.clientId &&
      item?.clientId?._id !== appliedFilters.clientId
    ) {
      return false;
    }

    const itemDate = new Date(item.date).setHours(0, 0, 0, 0);

    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate).setHours(0, 0, 0, 0);
      if (itemDate < from) return false;
    }

    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate).setHours(0, 0, 0, 0);
      if (itemDate > to) return false;
    }

    return true;
  });

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

  const openFilter = () => {
    setFilterVisible(true);
    Animated.timing(filterAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeFilter = () => {
    Animated.timing(filterAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setFilterVisible(false));
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
      handleReset();
      setModalVisible(false);
    });
  };

  const handleReset = () => {
    setEditingPurchase(null);
    setClientId(null);
    setClientName('');
    setProductId(null);
    setProductName('');
    setProductPrice('');
    setQuantity('');
    setPurchasePrice('');
    setTaxRate('');
    setFreightCharges('');
    setFreightTax('');
    setStatus('pending');
    setIsPartial(false);
    setPaymentType('full');
    setPaymentMethod('Bank');
    setPaidAmount('');
    setPendingAmount('');
    setPendingFromOurs('');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setBillNo('');
    setDescription('');
    setErrors({});
    setStockError('');
  };

  const handleSubmit = async (finalPayments = paymentList) => {
    let newErrors = {};
    if (!clientName.trim()) newErrors.clientName = true;
    if (!productName.trim()) newErrors.productName = true;
    if (!quantity.trim()) newErrors.quantity = true;
    if (!purchasePrice.trim()) newErrors.purchasePrice = true;

    if (!finalPayments || finalPayments.length === 0) {
      Alert.alert('Payment Required', 'Please select a payment method');
      return;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      setTimeout(() => scrollToError(firstErrorField), 100);
      return;
    }

    const purchaseData = {
      clientId: clientId,
      productId: productId || null,
      date: new Date(date),
      quantity: Number(quantity),
      purchaseAmount: Number(purchasePrice),
      multipleProducts: null,
      isMultiProduct: false,
      statusOfTransaction: status,
      paymentType,
      payments: finalPayments,
      paymentMethod:
        finalPayments.map(payment => payment.method)[0] === 'cash'
          ? 'cash'
          : 'bank',
      pendingAmount: Number(pendingAmount),
      paidAmount:
        status === 'completed' ? Number(totalWithTax) : Number(paidAmount),
      pendingFromOurs: Number(pendingFromOurs) || 0,
      taxRate: taxRate || 0,
      taxAmount: taxAmountCalc.toString(),
      freightCharges: Number(freightCharges) || 0,
      freightTaxAmount: Number(freightTax) || 0,
      totalAmountWithoutTax: subTotal,
      totalAmountWithTax: totalWithTax,
      billNo: billNo || '',
      methodType: 'Payment',
      dueDate: dueDate ? new Date(dueDate) : null,
      description,
      pageName: 'Purchase',
    };

    if (editingPurchase) {
      try {
        setLoading(true);
        const res = await api.updatePurchase(editingPurchase._id, purchaseData);
        const updated = res;

        if (!updated._id) {
          throw new Error('Updated purchase missing _id');
        }
        setPurchases(prev =>
          prev.map(c => (c._id === updated._id ? updated : c)),
        );
        setModalVisible(false);
        handleReset();
      } catch (err) {
        console.log('Update error:', err.message);
        Alert.alert('Error', 'Failed to update purchase');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const res = await api.createPurchase(purchaseData);
        const updated = res.purchase || res;
        if (!updated || !updated._id) {
          throw new Error('Updated purchase missing _id');
        }
        setPurchases(prev => [updated, ...prev]);
        setModalVisible(false);
        handleReset();
      } catch (err) {
        console.log('Create error:', err.message);
        Alert.alert('Error', 'Failed to create purchase');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async id => {
    try {
      setLoading(true);
      await api.deletePurchase(id);
      setPurchases(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.log('Delete error:', err.message);
      Alert.alert('Error', 'Failed to delete purchase');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = item => {
    setEditingPurchase(item);
    setClientId(item?.clientId?._id || item.clientId);
    setClientName(item?.clientId?.clientName || '');
    setProductId(item?.productId?._id || item.productId);
    setProductName(item?.productId?.productName || '');
    setProductPrice(
      item.sellAmount?.toString() || item.productPrice?.toString() || '',
    );
    setQuantity(item.quantity?.toString() || '');
    setPurchasePrice(item.purchaseAmount?.toString() || '');
    const itemSubtotal = item.purchaseAmount * item.quantity || 1;
    setTaxRate(
      ((parseFloat(item.taxAmount || 0) / itemSubtotal) * 100).toFixed(2) || '',
    );
    setFreightCharges(item.freightCharges?.toString() || '');
    setFreightTax(item.freightTaxAmount?.toString() || '');
    setStatus(item.statusOfTransaction || 'pending');
    setIsPartial(item.paymentType === 'partial');
    setPaymentType(item.paymentType || 'full');
    setPaymentMethod(item.paymentMethod || 'Bank');
    setPaidAmount(item.paidAmount?.toString() || '');
    setPendingAmount(item.pendingAmount?.toString() || '');
    setPendingFromOurs(item.pendingFromOurs?.toString() || '');
    setDate(
      item.date
        ? new Date(item.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    );
    setDueDate(
      item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : '',
    );
    setBillNo(item.billNo?.toString() || '');
    setDescription(item.description || '');

    slideAnim.setValue(220);
    setModalVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  const loadPurchases = async () => {
    try {
      setRefreshing(true);
      const res = await api.getAllPurchases();
      setPurchases(res.purchases || res);
    } catch (err) {
      console.log('Fetch error:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const onSubmitPurchase = () => {
    if (!productId || !quantity) {
      Alert.alert('Error', 'Fill required fields');
      return;
    }
    setTotalAmount(Number(totalWithTax.toFixed(2)));
    setShowPaymentModal(true);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        await Promise.all([
          api.getAllPurchases(),
          api.getAllClients(),
          api.getAllProducts(),
        ]).then(([purchaseRes, clientRes, productRes]) => {
          setPurchases(normalizeArray(purchaseRes.purchases || purchaseRes));
          setClients(normalizeArray(clientRes.clients || clientRes));
          setProducts(normalizeArray(productRes.products || productRes));
        });
      } catch (err) {
        console.log('Init load error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const openConfirm = useCallback((id, resetFunc) => {
    setPendingDeleteId(id);
    setPendingResetFunc(resetFunc);
    setConfirmVisible(true);
  }, []);

  // ✅ AUTO PENDING AMOUNT
  useEffect(() => {
    if (isPartial) {
      const total = Number(totalWithTax || 0);
      const paid = Number(paidAmount || 0);
      const pending = Math.max(total - paid, 0);
      setPendingAmount(String(pending.toFixed(2)));
    }
  }, [paidAmount, totalWithTax, isPartial]);

  // ✅ LIVE STOCK CHECK
  useEffect(() => {
    if (!quantity || !selectedProductStock) {
      setStockError('');
      return;
    }

    if (Number(quantity) > Number(selectedProductStock)) {
      setStockError(`Only ${selectedProductStock} items available in stock`);
    } else {
      setStockError('');
    }
  }, [quantity, selectedProductStock]);

  // ✅ DATE PICKER FUNCTION (Android)
  const showDatePicker = () => {
    if (Platform.OS !== 'android') return;

    try {
      DateTimePickerAndroid.open({
        value: date ? new Date(date) : new Date(),
        mode: 'date',
        is24Hour: true,
        display: 'calendar', // ✅ more stable than 'default'
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            const formatted = selectedDate.toISOString().split('T')[0];
            setDate(formatted);
          }
        },
      });
    } catch (err) {
      console.warn('Cannot open date picker', err);
    }
  };

  // ✅ DUE DATE PICKER FUNCTION (Android)
  const showDueDatePicker = () => {
    if (Platform.OS !== 'android') return;

    try {
      DateTimePickerAndroid.open({
        value: dueDate ? new Date(dueDate) : new Date(),
        mode: 'date',
        is24Hour: true,
        display: 'calendar', // ✅ stable on all Android versions
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            const formatted = selectedDate.toISOString().split('T')[0];
            setDueDate(formatted);
          }
        },
      });
    } catch (err) {
      console.warn('Cannot open due date picker', err);
    }
  };

  const purchaseStats = useMemo(() => {
    return filteredPurchases.reduce(
      (acc, item) => {
        acc.totalAmount += Number(item.totalAmountWithTax || 0);
        acc.paidAmount += Number(item.paidAmount || 0);
        acc.pendingAmount += Number(item.pendingAmount || 0);
        acc.count += 1;
        return acc;
      },
      {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        count: 0,
      },
    );
  }, [filteredPurchases]);

  return (
    <View style={styles.container}>
      <Navbar title="Purchase" onSearch={openSearch} onFilter={openFilter} />

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
            placeholder="Search purchases..."
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

      <View style={styles.statsWrapper}>
        {loading ? (
          <StatsSkeleton />
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statTile, styles.statYellow]}>
              <Text style={styles.statLabel}>Purchases</Text>
              <Text style={styles.statValue}>{purchaseStats.count}</Text>
            </View>

            <View style={[styles.statTile, styles.statGreen]}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>
                ₹{purchaseStats.totalAmount.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.statTile, styles.statBlue]}>
              <Text style={styles.statLabel}>Paid</Text>
              <Text style={styles.statValue}>
                ₹{purchaseStats.paidAmount.toFixed(2)}
              </Text>
            </View>

            <View style={[styles.statTile, styles.statRed]}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>
                ₹{purchaseStats.pendingAmount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )} */}

      {/* ✅ PURCHASE LIST */}
      {loading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3, 4, 5].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredPurchases}
          keyExtractor={item => item._id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadPurchases} />
          }
          renderItem={({ item }) => (
            <SwipeCard
              item={item}
              onDelete={handleDelete}
              onEdit={handleEdit}
              openConfirm={openConfirm}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="receipt-outline" size={44} color="#9CA3AF" />
              <Text style={styles.emptyText}>No Purchases Found</Text>
            </View>
          }
        />
      )}

      {/* ✅ FAB */}
      <TouchableOpacity style={styles.fab} onPress={openModal}>
        <Icon name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* ✅ CUSTOM DELETE CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <Animated.View style={styles.confirmBox}>
            <Icon name="trash-outline" size={42} color="#DC2626" />

            <Text style={styles.confirmTitle}>Delete Purchase?</Text>
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

      {/* ✅ MODAL */}
      <Modal visible={modalVisible} transparent animationType="none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalSheet,
              {
                maxHeight: '88%', // ✅ prevent overflow
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.dragHandle} />

            {/* ✅ FIXED HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPurchase ? 'Edit Purchase' : 'Add New Purchase'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* ✅ ONLY BODY SCROLLS */}
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {/* ✅ CLIENT + PRODUCT */}
              {/* <View style={styles.row2}> */}
              <TouchableOpacity
                {...registerField('clientName')}
                style={[
                  styles.selectHalf,
                  { marginBottom: 12 },
                  errors.clientName && styles.errorInput,
                ]}
                onPress={() => {
                  setPickerType('client');
                  setPickerVisible(true);
                }}
              >
                <View style={styles.inputRow}>
                  <Icon name="person-outline" size={18} color="#6B7280" />
                  <Text
                    style={clientName ? styles.selectText : styles.placeholder}
                  >
                    {clientName || 'Select client'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                {...registerField('productName')}
                style={[
                  styles.selectHalf,
                  { marginBottom: 12 },
                  errors.productName && styles.errorInput,
                ]}
                onPress={() => {
                  setPickerType('product');
                  setPickerVisible(true);
                }}
              >
                <View style={styles.inputRow}>
                  <Icon name="cube-outline" size={18} color="#6B7280" />
                  <Text
                    style={productName ? styles.selectText : styles.placeholder}
                  >
                    {productName || 'Select Product'}
                  </Text>
                </View>
              </TouchableOpacity>
              {/* </View> */}

              {/* ✅ DATE PICKER + BILL NO */}
              <View style={styles.row2}>
                <TouchableOpacity
                  style={styles.inputHalf}
                  onPress={showDatePicker}
                >
                  <View style={styles.inputRow}>
                    <Icon name="calendar-outline" size={18} color="#6B7280" />
                    <Text style={date ? styles.selectText : styles.placeholder}>
                      {date || 'Select Date'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.inputHalf}>
                  <View style={styles.inputRow}>
                    <Icon name="receipt-outline" size={18} color="#6B7280" />
                    <TextInput
                      placeholder="Bill No"
                      value={billNo}
                      onChangeText={setBillNo}
                      placeholderTextColor="#9CA3AF"
                      style={styles.textInputFlex}
                    />
                  </View>
                </View>
              </View>

              {/* ✅ QTY + PRICE */}
              <View
                {...registerField('quantity')}
                style={[
                  styles.inputHalf,
                  { marginBottom: 12 },
                  errors.quantity && styles.errorInput,
                ]}
              >
                <View style={styles.inputRow}>
                  <Icon name="layers-outline" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textInputFlex}
                  />
                </View>
              </View>

              <View
                {...registerField('purchasePrice')}
                style={[
                  styles.inputHalf,
                  { marginBottom: 12 },
                  errors.purchasePrice && styles.errorInput,
                ]}
              >
                <View style={styles.inputRow}>
                  <Icon name="cash-outline" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Purchase Price"
                    value={purchasePrice}
                    onChangeText={setPurchasePrice}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    style={styles.textInputFlex}
                  />
                </View>
              </View>

              {/* ✅ STOCK WARNING */}
              {stockError ? (
                <Text style={{ color: '#DC2626', marginBottom: 8 }}>
                  {stockError}
                </Text>
              ) : null}

              {/* ✅ TAX + FREIGHT */}
              <View style={styles.row2}>
                <TouchableOpacity
                  style={styles.inputHalf}
                  onPress={() => {
                    setPickerType('tax');
                    setPickerVisible(true);
                  }}
                >
                  <View style={styles.inputRow}>
                    <Icon name="calendar-outline" size={18} color="#6B7280" />
                    <Text
                      style={taxRate ? styles.selectText : styles.placeholder}
                    >
                      {taxRate ? `${taxRate}% Tax` : 'Select Tax Rate'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.inputHalf}>
                  <View style={styles.inputRow}>
                    <Icon name="receipt-outline" size={18} color="#6B7280" />
                    <TextInput
                      placeholder="Freight Charges"
                      value={freightCharges}
                      onChangeText={setFreightCharges}
                      keyboardType="numeric"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.inputHalf, { marginBottom: 12 }]}>
                <View style={styles.inputRow}>
                  <Icon name="receipt-outline" size={18} color="#6B7280" />
                  <TextInput
                    placeholder="Freight Tax Amount"
                    value={freightTax}
                    onChangeText={setFreightTax}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              {/* ✅ DESCRIPTION + DUE DATE */}
              <TouchableOpacity
                style={styles.input}
                onPress={showDueDatePicker}
              >
                <View style={styles.inputRow}>
                  <Icon name="time-outline" size={18} color="#6B7280" />
                  <Text
                    style={dueDate ? styles.selectText : styles.placeholder}
                  >
                    {dueDate || 'Select Due Date (Optional)'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.input}>
                <View style={styles.inputRowTop}>
                  <Icon
                    name="document-text-outline"
                    size={18}
                    color="#6B7280"
                  />
                  <TextInput
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    placeholderTextColor="#9CA3AF"
                    style={styles.textArea}
                  />
                </View>
              </View>

              {/* ✅ STATUS */}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Completed</Text>
                <Switch
                  value={status === 'completed'}
                  onValueChange={val =>
                    setStatus(val ? 'completed' : 'pending')
                  }
                />
              </View>

              {/* ✅ PAYMENT TYPE */}
              <View style={styles.paymentRow}>
                {['full', 'partial'].map(ptype => (
                  <TouchableOpacity
                    key={ptype}
                    style={[
                      styles.paymentBox,
                      paymentType === ptype && { backgroundColor: '#EFF6FF' },
                    ]}
                    onPress={() => setPaymentType(ptype)}
                  >
                    <Icon
                      name={
                        paymentType === ptype
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                    />
                    <Text style={{ textTransform: 'capitalize' }}>{ptype}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ✅ PAYMENT METHOD */}
              {/* <View style={styles.paymentRow}>
                {['Cash', 'Bank'].map(pmethod => (
                  <TouchableOpacity
                    key={pmethod}
                    style={[
                      styles.paymentBox,
                      paymentMethod === pmethod && {
                        backgroundColor: '#EFF6FF',
                      },
                    ]}
                    onPress={() => setPaymentMethod(pmethod)}
                  >
                    <Icon
                      name={
                        paymentMethod === pmethod
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                    />
                    <Text style={{ textTransform: 'capitalize' }}>
                      {pmethod}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View> */}

              {/* ✅ PARTIAL AMOUNTS */}
              {paymentType === 'partial' && (
                <View style={styles.row2}>
                  <TextInput
                    placeholder="Paid Amount"
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    style={styles.inputHalf}
                  />

                  <TextInput
                    placeholder="Pending Amount (Auto)"
                    value={pendingAmount}
                    editable={false}
                    placeholderTextColor="#9CA3AF"
                    style={styles.inputHalf}
                  />
                </View>
              )}

              {/* ✅ TOTAL DISPLAY */}
              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>₹{subTotal.toFixed(2)}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax ({taxRate || 0}%)</Text>
                  <Text style={styles.totalValue}>
                    ₹{taxAmountCalc.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Freight + Tax</Text>
                  <Text style={styles.totalValue}>
                    ₹
                    {(
                      Number(freightCharges || 0) +
                      Number(freightTaxAmountCalc || 0)
                    ).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalGrandLabel}>Grand Total</Text>
                  <Text style={styles.totalGrandValue}>
                    ₹{totalWithTax.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* ✅ ACTIONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, stockError && { opacity: 0.5 }]}
                  disabled={!!stockError}
                  onPress={onSubmitPurchase}
                >
                  <Text style={styles.saveText}>
                    {editingPurchase ? 'Update' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ✅ PICKER MODAL */}
      <Modal visible={pickerVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.centerModal}>
                <Text style={styles.pickerTitleModal}>
                  Select{' '}
                  {String(pickerType).charAt(0).toUpperCase() +
                    String(pickerType).slice(1)}
                </Text>
                {/* SEARCH */}
                <View style={styles.searchBoxPicker}>
                  <TextInput
                    placeholder="Search..."
                    placeholderTextColor="#9CA3AF"
                    value={pickerSearch}
                    onChangeText={setPickerSearch}
                    style={styles.searchInputPicker}
                    autoFocus
                  />
                </View>
                <FlatList
                  data={pickerData}
                  keyExtractor={(item, index) => item._id || index.toString()}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  onEndReached={() => {
                    if (!pickerLoading && pickerHasMore) {
                      loadPickerData();
                    }
                  }}
                  onEndReachedThreshold={0.5}
                  ListEmptyComponent={
                    !pickerLoading && (
                      <Text style={styles.placeholderPicker}>
                        No data found
                      </Text>
                    )
                  }
                  ListFooterComponent={
                    pickerLoading ? (
                      <View style={{ paddingVertical: 12 }}>
                        <Loading />
                      </View>
                    ) : !pickerHasMore && pickerData.length < 0 ? (
                      <Text
                        style={{
                          textAlign: 'center',
                          color: '#9CA3AF',
                          paddingVertical: 10,
                          fontSize: 12,
                        }}
                      >
                        No more results
                      </Text>
                    ) : null
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.optionRowPicker}
                      disabled={
                        pickerType === 'product' &&
                        (item.productQuantity || 0) <= 0
                      }
                      onPress={() => {
                        if (pickerType === 'client') {
                          setClientName(getTextValue(item.clientName));
                          setClientId(item._id);
                        }

                        if (pickerType === 'product') {
                          setProductName(item.productName);
                          setProductId(item._id);
                          setSelectedProductStock(item.productQuantity || 0);
                        }

                        if (pickerType === 'filterClient') {
                          setFilterClientName(item.clientName);
                          setFilterClientId(item._id);
                        }

                        setPickerVisible(false);
                        setPickerType('');
                        setPickerSearch('');
                      }}
                    >
                      <View style={styles.optionRowContent}>
                        <Text style={styles.optionTextPicker}>
                          {getTextValue(
                            pickerType.includes('client')
                              ? item.clientName
                              : pickerType.includes('product')
                              ? item.productName
                              : item,
                          )}
                        </Text>

                        {/* OPTIONAL STOCK BADGE */}
                        {pickerType === 'product' && (
                          <View
                            style={[
                              styles.qtyBadge,
                              {
                                backgroundColor:
                                  (item.productQuantity || 0) > 0
                                    ? '#DCFCE7'
                                    : '#FEE2E2',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.qtyTextPicker,
                                {
                                  color:
                                    (item.productQuantity || 0) > 0
                                      ? '#166534'
                                      : '#991B1B',
                                },
                              ]}
                            >
                              {item.productQuantity || 0}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={filterVisible} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeFilter}>
          <View style={styles.filterBackdrop} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.filterSidebar,
            { transform: [{ translateX: filterAnim }] },
          ]}
        >
          <Text style={styles.filterTitle}>Filters</Text>

          {/* 📅 FROM DATE */}
          <TouchableOpacity
            style={styles.input}
            onPress={() =>
              DateTimePickerAndroid.open({
                value: filterFromDate ? new Date(filterFromDate) : new Date(),
                mode: 'date',
                onChange: (_, d) =>
                  d && setFilterFromDate(d.toISOString().split('T')[0]),
              })
            }
          >
            <Text
              style={filterFromDate ? styles.selectText : styles.placeholder}
            >
              {filterFromDate || 'From Date'}
            </Text>
          </TouchableOpacity>

          {/* 📅 TO DATE */}
          <TouchableOpacity
            style={styles.input}
            onPress={() =>
              DateTimePickerAndroid.open({
                value: filterToDate ? new Date(filterToDate) : new Date(),
                mode: 'date',
                onChange: (_, d) =>
                  d && setFilterToDate(d.toISOString().split('T')[0]),
              })
            }
          >
            <Text style={filterToDate ? styles.selectText : styles.placeholder}>
              {filterToDate || 'To Date'}
            </Text>
          </TouchableOpacity>

          {/* 👤 CLIENT */}
          <TouchableOpacity
            style={styles.input}
            onPress={() => {
              setPickerType('filterClient');
              setPickerVisible(true);
            }}
          >
            <Text
              style={filterClientName ? styles.selectText : styles.placeholder}
            >
              {getTextValue(filterClientName) || 'Select Client'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => {
              setFilterClientId(null);
              setFilterClientName('');
              setFilterFromDate('');
              setFilterToDate('');
              setAppliedFilters(null);
              closeFilter();
            }}
          >
            <Text style={styles.cancelText}>Clear Filters</Text>
          </TouchableOpacity>

          {/* ACTIONS */}
          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeFilter}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                setAppliedFilters({
                  clientId: filterClientId,
                  fromDate: filterFromDate,
                  toDate: filterToDate,
                });
                closeFilter();
              }}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      <PaymentModal
        visible={showPaymentModal}
        defaultAmount={totalAmount}
        clients={clients}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={payment => {
          const payments = [payment];
          setPaymentList(payments);
          setShowPaymentModal(false);
          handleSubmit(payments);
        }}
      />

      <AccountSelectionModal
        visible={accountModalVisible}
        accounts={accounts}
        onClose={() => setAccountModalVisible(false)}
        onSelect={account => {
          setTransactionAccount(account._id);
          setAccountModalVisible(false);

          Alert.alert('Account Selected', `${account.accountName}`);
        }}
      />

      {/* ✅ BOTTOM NAV */}
      <BottomNav navigation={navigation} active="purchase" />
    </View>
  );
};

export default Purchase;

/* ========================================================= */
/* ===================== SWIPE CARD ======================== */
/* ========================================================= */

const SwipeCard = ({ item, onEdit, openConfirm }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState(false);

  /* ---------------- EXPAND ---------------- */

  const toggleExpand = () => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 0 : 1,
      duration: 260,
      useNativeDriver: false,
    }).start();
    setExpanded(prev => !prev);
  };

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  const chevronRotate = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const deleteTranslate = translateX.interpolate({
    inputRange: [-120, 0],
    outputRange: [0, 100],
    extrapolate: 'clamp',
  });

  const deleteOpacity = translateX.interpolate({
    inputRange: [-100, -40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  /* ---------------- STATUS ---------------- */

  const statusColor = {
    completed: '#16A34A',
    pending: '#F59E0B',
    partial: '#2563EB',
  }[item.statusOfTransaction || 'pending'];

  /* ---------------- SWIPE DELETE ---------------- */

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 15,

      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -120));
      },

      onPanResponderRelease: (_, g) => {
        if (g.dx < -90) {
          Animated.spring(translateX, {
            toValue: -110,
            speed: 20,
            bounciness: 0,
            useNativeDriver: true,
          }).start();

          openConfirm(item._id, () =>
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start(),
          );
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  /* ---------------- SAFE VALUES ---------------- */

  const clientName =
    getTextValue(item?.clientId?.clientName) || 'Unknown Client';
  const productName =
    getTextValue(item?.productId?.productName) || 'General Purchase';

  /* ---------------- RENDER ---------------- */

  return (
    <View style={styles.swipeWrapper}>
      {/* DELETE BG — SAME AS PRODUCT */}
      <View style={styles.deleteBg}>
        <Animated.View
          style={[
            styles.deletePill,
            {
              transform: [{ translateX: deleteTranslate }],
              opacity: deleteOpacity,
            },
          ]}
        >
          <Icon name="trash-outline" size={18} color="#DC2626" />
        </Animated.View>
      </View>

      {/* CARD */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
          {/* COLLAPSED — SAME STRUCTURE */}
          <View style={styles.row}>
            {/* LEFT */}
            <View style={styles.leftBlock}>
              <View style={styles.iconCircle}>
                <Icon name="cart-outline" size={18} color="#fff" />
              </View>

              <View style={styles.textBlock}>
                {/* 1️⃣ CLIENT NAME */}
                <Text numberOfLines={1} style={styles.productTitle}>
                  {clientName}
                </Text>

                {/* 2️⃣ PRODUCT + STATUS */}
                <View style={styles.metaRow}>
                  <Text numberOfLines={1} style={styles.assetType}>
                    {productName}
                  </Text>
                </View>

                {/* 3️⃣ DATE + QTY */}
                <Text style={styles.subMeta}>
                  {new Date(item.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  • Qty {item.quantity}
                </Text>

                <View style={styles.amountMain}>
                  <Text style={styles.amountHero} numberOfLines={1}>
                    ₹{item.totalAmountWithTax?.toFixed(2) || 0}
                  </Text>
                  <View style={styles.paymentMethod}>
                    {item.paymentMethod === 'cash' ? (
                      <Cash width={20} height={21} />
                    ) : item.paymentMethod === 'bank' ? (
                      <Gpay width={16} height={18} />
                    ) : (
                      <Idbi width={22} height={20} />
                    )}
                  </View>
                  <View
                    style={[
                      styles.qtyPill,
                      { backgroundColor: statusColor + '20' },
                    ]}
                  >
                    <Text style={[styles.qtyText, { color: statusColor }]}>
                      {item.statusOfTransaction}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* RIGHT */}
            <View style={styles.rightCol}>
              <Animated.View
                style={[
                  styles.arrowBox,
                  { transform: [{ rotate: chevronRotate }] },
                ]}
              >
                <Icon name="chevron-down" size={18} color="#9CA3AF" />
              </Animated.View>
            </View>
          </View>

          {/* EXPANDED — SAME CONTAINER STYLE */}
          <Animated.View style={{ height: expandedHeight, overflow: 'hidden' }}>
            <View style={styles.expandedBox}>
              {[
                [
                  'cash-outline',
                  'Purchase',
                  item.purchaseAmount * item.quantity,
                ],
                ['checkmark-done-outline', 'Paid', item.paidAmount],
                ['time-outline', 'Pending', item.pendingAmount],
                ['pricetag-outline', 'Tax', item.taxAmount || 0],
                ['bus-outline', 'Freight', item.freightCharges || 0],
              ].map(([icon, label, value]) => (
                <View key={label} style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <Icon name={icon} size={16} color="#6B7280" />
                    <Text style={styles.detailLabel}>{label}</Text>
                  </View>
                  <Text style={styles.detailValue}>₹ {value}</Text>
                </View>
              ))}

              <View style={styles.totalDivider} />

              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => onEdit(item)}
              >
                <Icon name="create-outline" size={16} color="#4338CA" />
                <Text style={styles.editText}>Edit Purchase</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    marginVertical: 6,
  },

  /* ================= DELETE ================= */

  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FEE2E2',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },

  deletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },

  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },

  /* ================= CARD ================= */

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ================= LEFT ================= */

  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  textBlock: {
    flex: 1,
  },

  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  qtyPill: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
  },

  qtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338CA',
    textTransform: 'capitalize',
  },

  subMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#9CA3AF',
  },

  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 84, // 👈 guarantees space for amount
  },

  amountMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  amountHero: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },

  arrowBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  assetType: {
    fontSize: 12,
    color: '#6B7280',
    maxWidth: '65%',
  },

  /* ================= RIGHT ================= */

  arrowWrap: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 10,
  },

  amountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  /* ================= EXPANDED ================= */

  expandedBox: {
    marginTop: 14,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  detailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  totalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },

  /* ================= ACTION ================= */

  editBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },

  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4338CA',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#6B7280',
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

  resetBtn: {
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

  centerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // modalTitle: {
  //   fontSize: 17,
  //   fontWeight: '800',
  //   color: '#111827',
  //   textAlign: 'center',
  //   marginBottom: 12,
  // },

  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '65%',
    paddingBottom: 10,
  },

  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },

  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    paddingHorizontal: 18,
  },

  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  pickerItemActive: {
    backgroundColor: '#F3F4F6',
  },

  pickerText: {
    fontSize: 15,
    color: '#111827',
  },

  pickerTextActive: {
    fontWeight: '700',
  },

  pickerBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 20,
    paddingVertical: 12,
    maxHeight: 300, // Prevent overflow
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
    justifyContent: 'center',
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
    justifyContent: 'center',
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

  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  /* ===================== SKELETON STYLES ===================== */

  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
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
    top: 15,
    left: 150,
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
    height: 76,
    alignItems: 'center',
    justifyContent: 'space-between',
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

  editBtnExpanded: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },

  toggleLabel: {
    fontSize: 15,
    marginHorizontal: 10,
    fontWeight: '600',
    color: '#111827',
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  checkLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: '#111827',
  },

  paymentRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },

  paymentBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },

  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  clientTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#111827',
  },

  productTitleSmall: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },

  billRow: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 4,
  },

  totalBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },

  totalBadgeText: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13.5,
  },

  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  filterSidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    elevation: 20,
  },

  filterTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },

  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  statValueGreen: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900',
    color: '#16A34A',
  },

  statValueBlue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900',
    color: '#2563EB',
  },

  statValueRed: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
  },

  statsWrapper: {
    paddingHorizontal: 16,
  },

  statsHeader: {
    marginBottom: 12,
  },

  statsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  statsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statTile: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    elevation: 1,
  },

  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  statValue: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  /* Accent backgrounds */
  statGreen: {
    backgroundColor: '#ECFDF5',
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

  statBlue: {
    backgroundColor: '#EFF6FF',
  },

  statYellow: {
    backgroundColor: '#FDF6E3',
  },

  statRed: {
    backgroundColor: '#FEF2F2',
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  inputRowTop: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  textInputFlex: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },

  textArea: {
    flex: 1,
    height: 70,
    textAlignVertical: 'center',
    fontSize: 15,
    color: '#111827',
  },

  statusRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 5,
  },

  statusPill: {
    alignSelf: 'flex-start', // ✅ KEY: fit-content width
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  paymentMethod: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 7,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },

  optionActive: {
    backgroundColor: '#F3F4F6',
  },

  optionText: {
    fontSize: 15,
    color: '#111827',
  },

  optionTextActive: {
    fontWeight: '700',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  paymentSheetPremium: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 26,
    paddingTop: 10,
  },

  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },

  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  sheetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },

  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },

  paymentCard: {
    width: '48%',
    height: 120,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
  },

  paymentCardActive: {
    borderWidth: 2,
    borderColor: '#111827',
  },

  paymentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  paymentLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  activeTick: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  centerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '75%',
    width: '90%',
    alignSelf: 'center',
  },

  pickerTitleModal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },

  searchBoxPicker: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  searchInputPicker: {
    height: 40,
    fontSize: 14,
    color: '#111827',
  },

  optionRowPicker: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  optionTextPicker: {
    fontSize: 15,
    color: '#111827',
  },

  placeholderPicker: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 20,
  },

  optionRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  qtyBadge: {
    minWidth: 32,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  qtyTextPicker: {
    fontSize: 12,
    fontWeight: '700',
  },

  statSkeleton: {
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  statSkeletonLabel: {
    width: '55%',
    height: 10,
    borderRadius: 6,
    backgroundColor: '#D1D5DB',
  },

  statSkeletonValue: {
    width: '40%',
    height: 18,
    borderRadius: 8,
    backgroundColor: '#D1D5DB',
    marginTop: 8,
  },

  statShimmer: {
    position: 'absolute',
    top: 0,
    left: -40,
    width: 100,
    height: '200%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
