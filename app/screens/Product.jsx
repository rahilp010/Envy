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
  Alert,
} from 'react-native';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import Loading from '../animation/Loading';
import { pick } from '@react-native-documents/picker';
import RNBlobUtil from 'react-native-blob-util';
import ImportCsv from '../utility/ImportCsv';

const SkeletonCard = () => {
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
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImg} />

      <View style={{ flex: 1 }}>
        <View style={styles.skeletonLineLg} />
        <View style={styles.skeletonLineMd} />
        <View style={styles.skeletonLineSm} />
      </View>

      <Animated.View
        style={[styles.skeletonShimmer, { transform: [{ translateX }] }]}
      />
    </View>
  );
};

const Product = ({ navigation }) => {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [errors, setErrors] = useState({});
  const slideAnim = useRef(new Animated.Value(200)).current;
  const [showSearch, setShowSearch] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingResetFunc, setPendingResetFunc] = useState(null);
  const [loading, setLoading] = useState(false);

  const [client, setClient] = useState('');
  const [clientId, setClientId] = useState(null);
  const [assetType, setAssetType] = useState('');
  const [saleHSN, setSaleHSN] = useState('');
  const [purchaseHSN, setPurchaseHSN] = useState('');
  const [tax, setTax] = useState('');
  const [part, setPart] = useState('');

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState([]);

  const [csvModalVisible, setCsvModalVisible] = useState(false);
  const [csvText, setCsvText] = useState('');

  // const clients = ['Client A', 'Client B', 'Client C'];
  const assetTypes = ['Raw Material', 'Finished Goods', 'Assets'];
  const parts = ['Main Part', 'Spare Part', 'Accessory'];

  useEffect(() => {
    slideAnim.setValue(200);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400); // ✅ 400ms debounce

    return () => clearTimeout(timer);
  }, [search]);

  const filteredProducts = products?.filter(item =>
    item.productName.toLowerCase().includes(debouncedSearch.toLowerCase()),
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
      setName('');
      setPrice('');
      setQty('');
      setEditingProduct(null);
      setErrors({});
      setModalVisible(false);
    });
  };

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const res = await api.getAllProducts();
      setProducts(res.products || res);
    } catch (err) {
      console.log('Product fetch error:', err.message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [refreshing]);

  const handleReset = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setQty('');
    setClient('');
    setAssetType('');
    setSaleHSN('');
    setPurchaseHSN('');
    setTax('');
    setPart('');
    setErrors({});
    closeModal();
  };

  const handleSubmit = async () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = true;
    if (!price.trim() || isNaN(price)) newErrors.price = true;
    if (!qty || Number(qty) <= 0) newErrors.qty = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const priceNum = Number(price) || 0;
    const qtyNum = Number(qty) || 0;
    const taxNum = Number(tax) || 0;

    const totalAmountWithoutTax = priceNum * qtyNum;

    const taxAmount = (totalAmountWithoutTax * taxNum) / 100;

    const totalAmountWithTax = totalAmountWithoutTax + taxAmount;

    const productData = {
      productName: name.trim(),
      productPrice: Number(price),
      productQuantity: Number(qty),
      clientName: client,
      assetType,
      saleHSN,
      purchaseHSN,
      taxRate: taxNum,
      taxAmount,
      totalAmountWithTax,
      totalAmountWithoutTax,
      addParts: part,
    };

    if (editingProduct) {
      setLoading(true);
      try {
        const res = await api.updateProduct(editingProduct._id, productData);

        const updated = res.product;

        setProducts(prev =>
          prev.map(p => (p._id === updated._id ? updated : p)),
        );

        handleReset();
      } catch (err) {
        console.log('Update error:', err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const res = await api.createProduct(productData);

        const updated = res.product;

        setProducts(prev => [updated, ...prev]);

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
    setLoading(true);
    try {
      await api.deleteProduct(id);

      setProducts(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.log('Delete error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = item => {
    setEditingProduct(item);

    setName(item.productName || '');
    setPrice(item.productPrice?.toString() || '');
    setQty(item.productQuantity?.toString() || '');
    setClient(item.clientName || '');
    setAssetType(item.assetType || '');
    setSaleHSN(item.saleHSN || '');
    setPurchaseHSN(item.purchaseHSN || '');
    setTax(item.taxRate?.toString() || '');
    setPart(item.addParts || '');

    slideAnim.setValue(220);
    setModalVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        await Promise.all([api.getAllClients(), api.getAllProducts()]).then(
          ([clientRes, productRes]) => {
            setClients(clientRes.clients || clientRes);
            setProducts(productRes.products || productRes);
          },
        );
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

  const livePrice = Number(price) || 0;
  const liveQty = Number(qty) || 0;
  const liveTax = Number(tax) || 0;

  const liveSubTotal = livePrice * liveQty;
  const liveTaxAmount = (liveSubTotal * liveTax) / 100;
  const liveGrandTotal = liveSubTotal + liveTaxAmount;

  return (
    <View style={styles.container}>
      <Navbar title="Products" onSearch={openSearch} />

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
          data={filteredProducts}
          keyExtractor={item => item._id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadProducts} />
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
              <Icon name="cube-outline" size={44} color="#9CA3AF" />
              <Text style={styles.emptyText}>No products found</Text>
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

            <Text style={styles.confirmTitle}>Delete Product?</Text>
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
        active="product"
        csvModalVisible={csvModalVisible}
        setCsvModalVisible={setCsvModalVisible}
        loadProducts={loadProducts}
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
                {editingProduct ? 'Edit Product' : 'Add New Product'}
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
              {/* ✅ ROW 1: CLIENT + ASSET */}
              <View style={styles.row2}>
                <TouchableOpacity
                  style={styles.selectHalf}
                  onPress={() => {
                    setPickerType('client');
                    setPickerVisible(true);
                  }}
                >
                  <Text style={client ? styles.selectText : styles.placeholder}>
                    {client || 'Client'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectHalf}
                  onPress={() => {
                    setPickerType('asset');
                    setPickerVisible(true);
                  }}
                >
                  <Text
                    style={assetType ? styles.selectText : styles.placeholder}
                  >
                    {assetType || 'Asset Type'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ✅ ROW 2: SALE HSN + PURCHASE HSN */}
              <View style={styles.row2}>
                <TextInput
                  placeholder="Sale HSN"
                  placeholderTextColor="#9CA3AF"
                  value={saleHSN}
                  onChangeText={setSaleHSN}
                  style={styles.inputHalf}
                />

                <TextInput
                  placeholder="Purchase HSN"
                  placeholderTextColor="#9CA3AF"
                  value={purchaseHSN}
                  onChangeText={setPurchaseHSN}
                  style={styles.inputHalf}
                />
              </View>

              {/* ✅ PRODUCT NAME - FULL */}
              <TextInput
                placeholder="Product Name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                style={[styles.input, errors.name && styles.errorInput]}
              />

              {/* ✅ ROW 3: PRICE + TAX */}
              <View style={styles.row2}>
                <View style={styles.priceHalf}>
                  <Text style={styles.currency}>₹</Text>
                  <TextInput
                    placeholder="Price"
                    placeholderTextColor="#9CA3AF"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    style={styles.priceHalfInput}
                  />
                </View>
                <TextInput
                  placeholder="Tax %"
                  placeholderTextColor="#9CA3AF"
                  value={tax}
                  onChangeText={setTax}
                  keyboardType="numeric"
                  style={styles.inputHalf}
                />
              </View>

              {/* ✅ ROW 4: QUANTITY + PART */}
              <View style={styles.row2}>
                <View style={styles.qtyHalf}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() =>
                      setQty(prev =>
                        Math.max(1, Number(prev || 1) - 1).toString(),
                      )
                    }
                  >
                    <Icon name="remove" size={18} />
                  </TouchableOpacity>

                  <Text style={styles.qtyText}>{qty || '1'}</Text>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() =>
                      setQty(prev => (Number(prev || 0) + 1).toString())
                    }
                  >
                    <Icon name="add" size={18} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.selectHalf}
                  onPress={() => {
                    setPickerType('part');
                    setPickerVisible(true);
                  }}
                >
                  <Text style={part ? styles.selectText : styles.placeholder}>
                    {part || 'Add Part'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ✅ TOTAL SUMMARY CARD (FULL WIDTH BELOW) */}
              <View style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    ₹ {liveSubTotal.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax ({liveTax || 0}%)</Text>
                  <Text style={styles.totalValue}>
                    ₹ {liveTaxAmount.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.totalDivider} />

                <View style={styles.totalRow}>
                  <Text style={styles.totalGrandLabel}>Grand Total</Text>
                  <Text style={styles.totalGrandValue}>
                    ₹ {liveGrandTotal.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* ✅ ACTION BUTTONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
                  <Text style={styles.saveText}>
                    {editingProduct ? 'Update' : 'Submit'}
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
            {/* STOP propagation INSIDE */}
            <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
              <View style={styles.centerModal}>
                <Text style={styles.pickerTitle}>
                  Select{' '}
                  {String(pickerType).charAt(0).toUpperCase() +
                    String(pickerType).slice(1)}
                </Text>
                <FlatList
                  data={
                    pickerType === 'client'
                      ? clients
                      : pickerType === 'asset'
                      ? assetTypes
                      : parts
                  }
                  keyExtractor={(item, index) =>
                    item?._id ? item._id : index.toString()
                  }
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No data available</Text>
                  }
                  renderItem={({ item }) => {
                    const label =
                      pickerType === 'client' ? item.clientName : item;

                    return (
                      <TouchableOpacity
                        style={[styles.optionRow]}
                        onPress={() => {
                          if (pickerType === 'client') {
                            setClient(item.clientName);
                            setClientId(item._id);
                          }

                          if (pickerType === 'asset') {
                            setAssetType(item);
                          }

                          if (pickerType === 'part') {
                            setPart(item);
                          }

                          setPickerVisible(false);
                        }}
                      >
                        <Text style={[styles.optionText]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ✅ BOTTOM NAV */}
      <BottomNav navigation={navigation} active="product" />
    </View>
  );
};

export default Product;

/* ========================================================= */
/* ===================== SWIPE CARD ======================== */
/* ========================================================= */

const SwipeCard = ({ item, onDelete, onEdit, openConfirm }) => {
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
                {item.productName}
              </Text>
              <Text style={styles.assetType}>{item.assetType}</Text>
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
                  Stock: {item.productQuantity}
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
                        rotate: expanded ? '180deg' : '0deg', // ✅ rotate arrow
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
                <Text style={styles.detailLabel}>Price(AVG)</Text>
                <Text style={styles.detailValue}>₹ {item.productPrice}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Client</Text>
                <Text style={styles.detailValue}>{item.clientName || '—'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sale HSN</Text>
                <Text style={styles.detailValue}>{item.saleHSN || '—'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purchase HSN</Text>
                <Text style={styles.detailValue}>
                  {item.purchaseHSN || '—'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tax</Text>
                <Text style={styles.detailValue}>{item.taxRate}%</Text>
              </View>

              <View style={styles.totalDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₹ {item.totalAmountWithTax}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editBtnExpanded}
                onPress={() => onEdit(item)}
              >
                <Icon name="create-outline" size={18} />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
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

  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },

  pickerText: {
    fontSize: 14,
    fontWeight: '500',
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
    left: -80,
    width: 80,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
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
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },

  editText: {
    color: '#fff',
    fontWeight: '700',
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

  centerModal: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    elevation: 10,
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
});
