import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import Loader from '../components/common/Loader';
import EditableTaxInvoiceModal from '../components/modals/EditableTaxInvoiceModal';
import SalesInvoiceModal from '../components/modals/SalesInvoiceModal';
import { getAllSales } from '../database/handlers/salesHandlers';
import { getCompanyProfile } from '../database/handlers/settingsHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function InvoiceStudioScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [company, setCompany] = useState(null);

  const [editorModalVisible, setEditorModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [sales, prof] = await Promise.all([
        getAllSales(),
        getCompanyProfile(),
      ]);
      setRecentInvoices((sales || []).slice(0, 10));
      setCompany(prof);
    } catch (err) {
      console.error('InvoiceStudio data error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenPreview = (tx) => {
    setSelectedTx(tx);
    setPreviewModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Invoice Studio"
        subtitle="Custom Tax Invoices & Layouts"
        leftAction="menu"
      />

      {loading ? (
        <Loader fullScreen={false} message="Loading Invoice Studio..." />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#daf4aa" />
          }
        >
          {/* Quick Create Hero Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroSub}>CUSTOM BILL GENERATOR</Text>
              <Text style={styles.heroTitle}>Live Tax Invoice Studio</Text>
              <Text style={styles.heroDesc}>
                Create fully customizable GST tax invoices with dynamic line items, taxes, discounts and instant WhatsApp sharing.
              </Text>
              <TouchableOpacity
                style={styles.heroBtn}
                onPress={() => setEditorModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color="#0f172a" />
                <Text style={styles.heroBtnText}>Launch Invoice Designer</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Letterhead Preview Card */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACTIVE LETTERHEAD & BRANDING</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={styles.editLink}>Edit Profile →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.letterheadBox}>
              <Text style={styles.compName}>{company?.companyName || 'ENVY ENTERPRISE'}</Text>
              <Text style={styles.compTag}>{company?.tagline || 'Industrial & Commercial Solutions'}</Text>
              <Text style={styles.compDetail}>
                {company?.gstin ? `GSTIN: ${company.gstin} • ` : ''}
                {company?.phone || 'No phone set'}
              </Text>
              <Text style={styles.bankDetail}>
                Bank: {company?.bankName || 'State Bank of India'} (A/C: {company?.bankAccNo || 'XXXXXXXX'})
              </Text>
            </View>
          </View>

          {/* Recent Invoices Log */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>RECENT TAX INVOICES ({recentInvoices.length})</Text>
            {recentInvoices.length === 0 ? (
              <Text style={styles.emptyNote}>No invoices generated yet</Text>
            ) : (
              recentInvoices.map((tx, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.txItem}
                  onPress={() => handleOpenPreview(tx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.txIconWrap}>
                    <MaterialCommunityIcons name="receipt-outline" size={18} color="#daf4aa" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.txBillNo}>{tx.billNo || 'SAL-NEW'}</Text>
                    <Text style={styles.txClient}>{tx.clientName || 'Cash Sale'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.txAmount}>
                      ₹{parseFloat(tx.totalAmountWithTax || tx.saleAmount || 0).toFixed(2)}
                    </Text>
                    <Text style={styles.txDate}>
                      {tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : '-'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Editor Modal */}
      <EditableTaxInvoiceModal
        visible={editorModalVisible}
        onClose={() => setEditorModalVisible(false)}
      />

      {/* Preview Modal */}
      <SalesInvoiceModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        transaction={selectedTx}
        client={{ clientName: selectedTx?.clientName, phoneNo: selectedTx?.clientPhone }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#161d2d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.2)',
  },
  heroLeft: {},
  heroSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginVertical: 4,
  },
  heroDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  heroBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  editLink: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '600',
  },
  letterheadBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  compName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  compTag: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
  },
  compDetail: {
    color: '#94a3b8',
    fontSize: 11,
  },
  bankDetail: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyNote: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txBillNo: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  txClient: {
    color: '#94a3b8',
    fontSize: 11,
  },
  txAmount: {
    color: '#daf4aa',
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    color: '#64748b',
    fontSize: 10,
  },
});
