import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AppHeader from '../components/common/AppHeader';
import SearchBar from '../components/common/SearchBar';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import {
  CustomInput,
  CustomButton,
  CustomSelect,
  CustomToggle,
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../database/handlers/productHandlers';
import {
  setProducts,
  createProduct as createProductAction,
  updateProduct as updateProductAction,
  deleteProduct as deleteProductAction,
} from '../app/features/envySlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ASSET_TYPES = [
  { label: 'Raw Material', value: 'Raw Material' },
  { label: 'Finished Goods', value: 'Finished Goods' },
  { label: 'Assets', value: 'Assets' },
];

export default function ProductsScreen({ navigation }) {
  const dispatch = useDispatch();
  const reduxProducts = useSelector((state) => state.envy.products.data);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    productPrice: '',
    productQuantity: '',
    assetsType: 'Raw Material',
    saleHSN: '',
    purchaseHSN: '',
  });

  const loadProducts = useCallback(async () => {
    try {
      const data = await getAllProducts();
      dispatch(setProducts(data || []));
    } catch (err) {
      console.warn('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const filteredProducts = useMemo(() => {
    return reduxProducts.filter((p) => {
      const matchesSearch =
        p.productName?.toLowerCase().includes(search.toLowerCase()) ||
        p.saleHSN?.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        selectedAssetFilter === 'ALL' || p.assetsType === selectedAssetFilter;

      return matchesSearch && matchesFilter;
    });
  }, [reduxProducts, search, selectedAssetFilter]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      productName: '',
      productPrice: '',
      productQuantity: '0',
      assetsType: 'Raw Material',
      saleHSN: '',
      purchaseHSN: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      productPrice: String(product.productPrice || 0),
      productQuantity: String(product.productQuantity || 0),
      assetsType: product.assetsType || 'Raw Material',
      saleHSN: product.saleHSN || '',
      purchaseHSN: product.purchaseHSN || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.productName.trim()) {
      showErrorToast('Validation Error', 'Product Name is required');
      return;
    }
    const price = parseFloat(formData.productPrice) || 0;
    const qty = parseInt(formData.productQuantity, 10) || 0;

    try {
      if (editingProduct) {
        const payload = {
          ...editingProduct,
          productName: formData.productName.trim(),
          productPrice: price,
          productQuantity: qty,
          assetsType: formData.assetsType,
          saleHSN: formData.saleHSN,
          purchaseHSN: formData.purchaseHSN,
        };
        await updateProduct(payload);
        dispatch(updateProductAction(payload));
        showSuccessToast('Product Updated', `"${payload.productName}" saved`);
      } else {
        const payload = {
          productName: formData.productName.trim(),
          productPrice: price,
          productQuantity: qty,
          assetsType: formData.assetsType,
          saleHSN: formData.saleHSN,
          purchaseHSN: formData.purchaseHSN,
          createdAt: new Date().toISOString(),
        };
        const res = await createProduct(payload);
        dispatch(createProductAction({ ...payload, id: res.insertId }));
        showSuccessToast('Product Created', `"${payload.productName}" added`);
      }
      setModalVisible(false);
      loadProducts();
    } catch (err) {
      showErrorToast('Save Error', err.message);
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id);
              dispatch(deleteProductAction(id));
              showSuccessToast('Deleted', `"${name}" removed`);
            } catch (err) {
              showErrorToast('Delete Error', err.message);
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  const renderProductItem = ({ item }) => {
    const totalWorth = (Number(item.productPrice) || 0) * (Number(item.productQuantity) || 0);

    return (
      <Card
        style={styles.productCard}
        title={item.productName}
        subtitle={item.saleHSN ? `HSN: ${item.saleHSN}` : 'No HSN code'}
        badge={item.assetsType || 'RAW'}
        badgeColor={
          item.assetsType === 'Finished Goods'
            ? 'rgba(74, 222, 128, 0.15)'
            : item.assetsType === 'Assets'
            ? 'rgba(251, 146, 60, 0.15)'
            : 'rgba(96, 165, 250, 0.15)'
        }
        badgeTextColor={
          item.assetsType === 'Finished Goods'
            ? '#4ade80'
            : item.assetsType === 'Assets'
            ? '#fb923c'
            : '#60a5fa'
        }
        icon={<MaterialCommunityIcons name="cube-outline" size={20} color="#a78bfa" />}
        rightAction={
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => openEditModal(item)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="pencil-outline" size={18} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, item.productName)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
            </TouchableOpacity>
          </View>
        }
      >
        <View style={styles.cardMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Price / Unit</Text>
            <Text style={styles.metricValue}>{formatCurrency(item.productPrice)}</Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Stock Qty</Text>
            <Text
              style={[
                styles.metricValue,
                Number(item.productQuantity) <= 0 ? styles.stockLow : styles.stockGood,
              ]}
            >
              {item.productQuantity || 0} units
            </Text>
          </View>

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Worth</Text>
            <Text style={styles.metricValue}>{formatCurrency(totalWorth)}</Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Products Catalog"
        subtitle={`${filteredProducts.length} items available`}
        rightActions={
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <MaterialCommunityIcons name="plus" size={20} color="#16161b" />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search products by name or HSN..."
        />

        {/* Filter Pills */}
        <View style={styles.filterBar}>
          {['ALL', 'Raw Material', 'Finished Goods', 'Assets'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                selectedAssetFilter === filter ? styles.filterPillActive : null,
              ]}
              onPress={() => setSelectedAssetFilter(filter)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedAssetFilter === filter ? styles.filterPillTextActive : null,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <Loader message="Loading Product Catalog..." />
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderProductItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon="package-variant-closed"
                title="No Products Found"
                description={
                  search
                    ? `No products match "${search}"`
                    : 'Start by creating your first product in the inventory'
                }
                actionLabel="Add New Product"
                onAction={openAddModal}
              />
            }
          />
        )}
      </View>

      {/* Add / Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <CustomInput
                label="Product Name *"
                placeholder="e.g. Copper Wire 4mm"
                value={formData.productName}
                onChangeText={(val) => setFormData({ ...formData, productName: val })}
                icon="cube-outline"
              />

              <View style={styles.modalRow}>
                <CustomInput
                  style={{ flex: 1, marginRight: 8 }}
                  label="Unit Price (₹) *"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={formData.productPrice}
                  onChangeText={(val) => setFormData({ ...formData, productPrice: val })}
                  icon="currency-inr"
                />

                <CustomInput
                  style={{ flex: 1, marginLeft: 8 }}
                  label="Initial Stock Qty"
                  placeholder="0"
                  keyboardType="numeric"
                  value={formData.productQuantity}
                  onChangeText={(val) => setFormData({ ...formData, productQuantity: val })}
                  icon="numeric"
                />
              </View>

              <CustomSelect
                label="Asset Category"
                value={formData.assetsType}
                items={ASSET_TYPES}
                onValueChange={(val) => setFormData({ ...formData, assetsType: val })}
              />

              <View style={styles.modalRow}>
                <CustomInput
                  style={{ flex: 1, marginRight: 8 }}
                  label="Sale HSN Code"
                  placeholder="e.g. 8471"
                  value={formData.saleHSN}
                  onChangeText={(val) => setFormData({ ...formData, saleHSN: val })}
                />

                <CustomInput
                  style={{ flex: 1, marginLeft: 8 }}
                  label="Purchase HSN Code"
                  placeholder="e.g. 8471"
                  value={formData.purchaseHSN}
                  onChangeText={(val) => setFormData({ ...formData, purchaseHSN: val })}
                />
              </View>

              <CustomButton
                title={editingProduct ? 'Update Product' : 'Create Product'}
                onPress={handleSave}
                style={{ marginTop: 12, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161b',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#16161b',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#20212a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: '#7c3aed',
  },
  filterPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 24,
  },
  productCard: {
    marginVertical: 5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  cardMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  stockLow: {
    color: '#f43f5e',
  },
  stockGood: {
    color: '#4ade80',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#1e1f28',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalForm: {
    maxHeight: 500,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
