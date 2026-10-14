import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCompanyProfile } from '../../database/handlers/settingsHandlers';
import { numberToWords } from '../../services/pdfService';
import { shareInvoiceText, shareOnWhatsApp } from '../../services/shareService';

export default function EditableTaxInvoiceModal({
  visible,
  onClose,
  initialData = {},
  onSave,
}) {
  const [company, setCompany] = useState(null);
  const [billNo, setBillNo] = useState(initialData.billNo || 'SAL-NEW');
  const [date, setDate] = useState(
    initialData.date || new Date().toISOString().split('T')[0]
  );
  const [clientName, setClientName] = useState(initialData.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialData.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(initialData.clientAddress || '');
  const [clientGstin, setClientGstin] = useState(initialData.clientGstin || '');

  const [items, setItems] = useState(
    initialData.items || [
      {
        productName: 'Sample Item',
        saleHSN: '8471',
        quantity: '1',
        productPrice: '1000',
        taxRate: '18',
      },
    ]
  );

  const [discount, setDiscount] = useState(String(initialData.discount || 0));
  const [freight, setFreight] = useState(String(initialData.freight || 0));

  useEffect(() => {
    if (visible) {
      getCompanyProfile().then((p) => setCompany(p));
      if (initialData.billNo) setBillNo(initialData.billNo);
      if (initialData.clientName) setClientName(initialData.clientName);
    }
  }, [visible, initialData]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productName: '',
        saleHSN: '',
        quantity: '1',
        productPrice: '0',
        taxRate: '18',
      },
    ]);
  };

  const removeItem = (idx) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'At least one item is required');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Math totals
  let taxableTotal = 0;
  let taxTotal = 0;
  items.forEach((it) => {
    const q = parseFloat(it.quantity) || 0;
    const r = parseFloat(it.productPrice) || 0;
    const t = parseFloat(it.taxRate) || 0;
    const lineAmt = q * r;
    const lineTax = (lineAmt * t) / 100;
    taxableTotal += lineAmt;
    taxTotal += lineTax;
  });

  const parsedDisc = parseFloat(discount) || 0;
  const parsedFreight = parseFloat(freight) || 0;
  const grandTotal = Math.max(0, taxableTotal - parsedDisc + taxTotal + parsedFreight);
  const words = numberToWords(grandTotal);

  const handleShare = () => {
    const tx = {
      billNo,
      date,
      clientName,
      totalAmountWithTax: grandTotal,
      totalAmountWithoutTax: taxableTotal,
      taxAmount: taxTotal,
      statusOfTransaction: 'Completed',
      paymentMethod: 'Bank',
    };
    shareInvoiceText({ transaction: tx, client: { clientName, phoneNo: clientPhone }, company });
  };

  const handleWhatsApp = () => {
    const tx = {
      billNo,
      date,
      clientName,
      totalAmountWithTax: grandTotal,
      statusOfTransaction: 'Completed',
    };
    shareOnWhatsApp({
      phone: clientPhone,
      transaction: tx,
      client: { clientName, phoneNo: clientPhone },
      company,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Navbar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.navTitle}>Invoice Studio Editor</Text>
            <Text style={styles.navSub}>Customize & Generate Live Bills</Text>
          </View>
          <TouchableOpacity onPress={handleWhatsApp} style={[styles.navActionBtn, { backgroundColor: '#10b981' }]}>
            <MaterialCommunityIcons name="whatsapp" size={18} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={[styles.navActionBtn, { backgroundColor: '#7c3aed' }]}>
            <MaterialCommunityIcons name="share-variant" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Bill Meta Section */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>INVOICE DETAILS</Text>
            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Bill No</Text>
                <TextInput
                  style={styles.input}
                  value={billNo}
                  onChangeText={setBillNo}
                  placeholder="SAL-0001"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.label}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            {/* Customer Details */}
            <View style={styles.inputBox}>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={styles.input}
                value={clientName}
                onChangeText={setClientName}
                placeholder="e.g. Ramesh Hardware"
                placeholderTextColor="#64748b"
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Customer Phone</Text>
                <TextInput
                  style={styles.input}
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  keyboardType="phone-pad"
                  placeholder="10-digit number"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.label}>Customer GSTIN</Text>
                <TextInput
                  style={styles.input}
                  value={clientGstin}
                  onChangeText={setClientGstin}
                  placeholder="Optional GST"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeader}>LINE ITEMS ({items.length})</Text>
              <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
                <MaterialCommunityIcons name="plus" size={16} color="#0f172a" />
                <Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {items.map((it, idx) => {
              const q = parseFloat(it.quantity) || 0;
              const r = parseFloat(it.productPrice) || 0;
              const lineAmt = (q * r).toFixed(2);

              return (
                <View key={idx} style={styles.itemBox}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemIdxText}>#{idx + 1}</Text>
                    <Text style={styles.itemSubtotal}>Line Total: ₹{lineAmt}</Text>
                    <TouchableOpacity onPress={() => removeItem(idx)} style={styles.deleteBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.input, { marginBottom: 6 }]}
                    value={it.productName}
                    onChangeText={(val) => updateItem(idx, 'productName', val)}
                    placeholder="Product / Service Description"
                    placeholderTextColor="#64748b"
                  />

                  <View style={styles.row}>
                    <View style={[styles.inputBox, { flex: 1, marginRight: 6 }]}>
                      <Text style={styles.label}>HSN</Text>
                      <TextInput
                        style={styles.input}
                        value={it.saleHSN}
                        onChangeText={(val) => updateItem(idx, 'saleHSN', val)}
                        placeholder="HSN"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <View style={[styles.inputBox, { flex: 0.8, marginRight: 6 }]}>
                      <Text style={styles.label}>Qty</Text>
                      <TextInput
                        style={styles.input}
                        value={String(it.quantity)}
                        onChangeText={(val) => updateItem(idx, 'quantity', val)}
                        keyboardType="numeric"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <View style={[styles.inputBox, { flex: 1.2, marginRight: 6 }]}>
                      <Text style={styles.label}>Rate (₹)</Text>
                      <TextInput
                        style={styles.input}
                        value={String(it.productPrice)}
                        onChangeText={(val) => updateItem(idx, 'productPrice', val)}
                        keyboardType="numeric"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <View style={[styles.inputBox, { flex: 0.8 }]}>
                      <Text style={styles.label}>GST%</Text>
                      <TextInput
                        style={styles.input}
                        value={String(it.taxRate)}
                        onChangeText={(val) => updateItem(idx, 'taxRate', val)}
                        keyboardType="numeric"
                        placeholderTextColor="#64748b"
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Adjustments & Totals */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>ADJUSTMENTS & GRAND TOTAL</Text>
            <View style={styles.row}>
              <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Discount (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={[styles.inputBox, { flex: 1 }]}>
                <Text style={styles.label}>Freight / Shipping (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={freight}
                  onChangeText={setFreight}
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Taxable Subtotal:</Text>
                <Text style={styles.sumVal}>₹{taxableTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.sumRow}>
                <Text style={styles.sumLabel}>Total GST Tax:</Text>
                <Text style={styles.sumVal}>₹{taxTotal.toFixed(2)}</Text>
              </View>
              <View style={[styles.sumRow, styles.grandRow]}>
                <Text style={styles.grandLabel}>Net Grand Total:</Text>
                <Text style={styles.grandVal}>₹{grandTotal.toFixed(2)}</Text>
              </View>
              <Text style={styles.wordsText}>"{words}"</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    padding: 6,
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  navSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  navActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addItemText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
  },
  inputBox: {
    marginBottom: 10,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  itemBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIdxText: {
    color: '#daf4aa',
    fontWeight: '700',
    fontSize: 12,
  },
  itemSubtotal: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
  summaryBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  sumLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  sumVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  grandRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 6,
    paddingTop: 8,
  },
  grandLabel: {
    color: '#daf4aa',
    fontSize: 14,
    fontWeight: '800',
  },
  grandVal: {
    color: '#daf4aa',
    fontSize: 16,
    fontWeight: '800',
  },
  wordsText: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
});
