import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getCompanyProfile } from '../../database/handlers/settingsHandlers';
import { shareInvoiceText, shareOnWhatsApp } from '../../services/shareService';
import { numberToWords } from '../../services/pdfService';

export default function SalesInvoiceModal({
  visible,
  onClose,
  transaction,
  client,
}) {
  const [company, setCompany] = useState(null);

  useEffect(() => {
    if (visible) {
      getCompanyProfile().then((p) => setCompany(p));
    }
  }, [visible]);

  if (!transaction) return null;

  // Parse items
  let items = [];
  if (transaction.isMultiProduct && transaction.multipleProducts) {
    try {
      const parsed = typeof transaction.multipleProducts === 'string'
        ? JSON.parse(transaction.multipleProducts)
        : transaction.multipleProducts;
      if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
    } catch {
      items = [];
    }
  }

  if (items.length === 0) {
    items = [
      {
        productName: transaction.productName || 'General Product',
        saleHSN: transaction.saleHSN || '-',
        quantity: transaction.quantity || 1,
        productPrice: transaction.saleAmount ? transaction.saleAmount / (transaction.quantity || 1) : 0,
        taxRate: transaction.taxRate || 18,
      },
    ];
  }

  const grandTotal = transaction.totalAmountWithTax || transaction.saleAmount || 0;
  const taxable = transaction.totalAmountWithoutTax || transaction.saleAmount || 0;
  const gstAmount = transaction.taxAmount || 0;
  const freight = transaction.freightCharges || 0;
  const discount = transaction.discount || 0;
  const words = numberToWords(grandTotal);

  const handleShare = () => {
    shareInvoiceText({ transaction, client, company });
  };

  const handleWhatsApp = () => {
    const phone = client?.phoneNo || transaction?.clientPhone || '';
    shareOnWhatsApp({ phone, transaction, client, company });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.topNav}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.navTitleBox}>
            <Text style={styles.navTitle}>Tax Invoice</Text>
            <Text style={styles.navSubtitle}>{transaction.billNo || 'SAL-NEW'}</Text>
          </View>
          <View style={styles.navActions}>
            <TouchableOpacity onPress={handleWhatsApp} style={[styles.actionIconBtn, { backgroundColor: '#10b981' }]}>
              <MaterialCommunityIcons name="whatsapp" size={20} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={[styles.actionIconBtn, { backgroundColor: '#7c3aed' }]}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Invoice Body Paper */}
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <View style={styles.invoicePaper}>
            {/* Company & Bill Type */}
            <View style={styles.paperHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{company?.companyName || 'ENVY ENTERPRISE'}</Text>
                <Text style={styles.tagline}>{company?.tagline || 'Industrial & Commercial Solutions'}</Text>
                {company?.address ? <Text style={styles.metaText}>{company.address}</Text> : null}
                <Text style={styles.metaText}>
                  {company?.phone ? `Ph: ${company.phone}` : ''} {company?.email ? `• ${company.email}` : ''}
                </Text>
                {company?.gstin ? <Text style={styles.gstText}>GSTIN: {company.gstin}</Text> : null}
              </View>
              <View style={styles.badgeContainer}>
                <View style={styles.taxBadge}>
                  <Text style={styles.taxBadgeText}>TAX INVOICE</Text>
                </View>
                <Text style={styles.invoiceMeta}>No: {transaction.billNo || '-'}</Text>
                <Text style={styles.invoiceMeta}>
                  Date: {transaction.date ? new Date(transaction.date).toLocaleDateString('en-IN') : '-'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bill To Info */}
            <View style={styles.billToSection}>
              <Text style={styles.sectionHeading}>BILLED TO (CUSTOMER)</Text>
              <Text style={styles.clientTitle}>{client?.clientName || transaction.clientName || 'Cash Customer'}</Text>
              {client?.address ? <Text style={styles.clientDetail}>{client.address}</Text> : null}
              <Text style={styles.clientDetail}>Phone: {client?.phoneNo || transaction?.clientPhone || '-'}</Text>
              {client?.gstNo ? <Text style={styles.clientDetail}>GST No: {client.gstNo}</Text> : null}
            </View>

            <View style={styles.divider} />

            {/* Items Table */}
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 0.6 }]}>#</Text>
              <Text style={[styles.th, { flex: 2.5, textAlign: 'left' }]}>Item</Text>
              <Text style={[styles.th, { flex: 1 }]}>HSN</Text>
              <Text style={[styles.th, { flex: 0.8 }]}>Qty</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Rate</Text>
              <Text style={[styles.th, { flex: 1.4, textAlign: 'right' }]}>Total</Text>
            </View>

            {items.map((item, idx) => {
              const qty = item.quantity || item.qty || 1;
              const rate = item.productPrice || item.rate || item.price || 0;
              const lineTotal = (qty * rate).toFixed(2);
              return (
                <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.rowAlt : null]}>
                  <Text style={[styles.td, { flex: 0.6 }]}>{idx + 1}</Text>
                  <Text style={[styles.td, { flex: 2.5, textAlign: 'left', fontWeight: '600' }]}>
                    {item.productName || 'Item'}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]}>{item.saleHSN || '-'}</Text>
                  <Text style={[styles.td, { flex: 0.8 }]}>{qty}</Text>
                  <Text style={[styles.td, { flex: 1.2 }]}>₹{parseFloat(rate).toFixed(1)}</Text>
                  <Text style={[styles.td, { flex: 1.4, textAlign: 'right', fontWeight: '700' }]}>
                    ₹{lineTotal}
                  </Text>
                </View>
              );
            })}

            <View style={styles.divider} />

            {/* Calculations Breakdown */}
            <View style={styles.summaryContainer}>
              <View style={styles.wordsBlock}>
                <Text style={styles.wordsLabel}>Amount in Words:</Text>
                <Text style={styles.wordsVal}>{words}</Text>
              </View>

              <View style={styles.mathBlock}>
                <View style={styles.mathRow}>
                  <Text style={styles.mathLabel}>Taxable Value:</Text>
                  <Text style={styles.mathVal}>₹{parseFloat(taxable).toFixed(2)}</Text>
                </View>
                {discount > 0 ? (
                  <View style={styles.mathRow}>
                    <Text style={styles.mathLabel}>Discount:</Text>
                    <Text style={[styles.mathVal, { color: '#16a34a' }]}>-₹{parseFloat(discount).toFixed(2)}</Text>
                  </View>
                ) : null}
                <View style={styles.mathRow}>
                  <Text style={styles.mathLabel}>GST Tax:</Text>
                  <Text style={styles.mathVal}>₹{parseFloat(gstAmount).toFixed(2)}</Text>
                </View>
                {freight > 0 ? (
                  <View style={styles.mathRow}>
                    <Text style={styles.mathLabel}>Freight:</Text>
                    <Text style={styles.mathVal}>₹{parseFloat(freight).toFixed(2)}</Text>
                  </View>
                ) : null}
                <View style={[styles.mathRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Grand Total:</Text>
                  <Text style={styles.grandTotalVal}>₹{parseFloat(grandTotal).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bank & Terms */}
            <View style={styles.footerInfo}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.footerSubhead}>Bank Details</Text>
                <Text style={styles.bankText}>Bank: {company?.bankName || 'State Bank of India'}</Text>
                <Text style={styles.bankText}>A/C: {company?.bankAccNo || 'XXXXXXXXXXXX'}</Text>
                <Text style={styles.bankText}>IFSC: {company?.bankIfsc || 'SBIN0000000'}</Text>
                <Text style={styles.bankText}>Branch: {company?.bankBranch || 'Main Branch'}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Text style={styles.signTitle}>For {company?.companyName || 'ENVY ERP'}</Text>
                <View style={styles.signLine} />
                <Text style={styles.signLabel}>Authorized Signatory</Text>
              </View>
            </View>

            {company?.terms ? (
              <View style={styles.termsBox}>
                <Text style={styles.termsTitle}>Terms & Conditions</Text>
                <Text style={styles.termsText}>{company.terms}</Text>
              </View>
            ) : null}
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
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconBtn: {
    padding: 6,
  },
  navTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  navSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  invoicePaper: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  companyName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  tagline: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#475569',
  },
  gstText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  badgeContainer: {
    alignItems: 'flex-end',
  },
  taxBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
  },
  taxBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  invoiceMeta: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  billToSection: {
    paddingVertical: 2,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  clientTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  clientDetail: {
    fontSize: 11,
    color: '#475569',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  th: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: '#f8fafc',
  },
  td: {
    fontSize: 11,
    color: '#1e293b',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  wordsBlock: {
    flex: 1.1,
    paddingRight: 10,
  },
  wordsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  wordsVal: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#0f172a',
    marginTop: 2,
  },
  mathBlock: {
    flex: 1,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  mathLabel: {
    fontSize: 11,
    color: '#475569',
  },
  mathVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#0f172a',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
    marginTop: 4,
    paddingVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  grandTotalVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerSubhead: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bankText: {
    fontSize: 10,
    color: '#334155',
  },
  signTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  signLine: {
    height: 1,
    backgroundColor: '#94a3b8',
    width: 120,
    marginTop: 35,
    marginBottom: 4,
  },
  signLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  termsBox: {
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 2,
  },
  termsText: {
    fontSize: 9,
    color: '#64748b',
    lineHeight: 12,
  },
});
