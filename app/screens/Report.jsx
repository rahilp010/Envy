/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Cash from '../../assets/cash.svg';
import GPay from '../../assets/googlepay.svg';
import Idbi from '../../assets/IDBIBank.svg';
import Loading from '../animation/Loading';
import BottomNav from '../components/BottomNav';

const Report = ({ navigation, route }) => {
  /* ===================== STATE ===================== */
  const { client } = route?.params || 0;
  const [type, setType] = useState('collection'); // collection | payment
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    overdueAmount: 0,
    totalParties: 0,
  });

  const [loading, setLoading] = useState(false);

  /* ===================== LOAD DATA ===================== */
  const loadData = async () => {
    try {
      setLoading(true);
      const res =
        type === 'collection'
          ? await api.getPendingCollections()
          : await api.getPendingPayments();

      // backend gives { totalPending, count, list }
      const list = res?.list || [];

      setData(list);

      setSummary({
        totalAmount: res?.totalPending || 0,
        overdueAmount: list
          .filter(i => {
            const days = Math.floor(
              (Date.now() - new Date(i.date).getTime()) / (1000 * 60 * 60 * 24),
            );
            return days > 30;
          })
          .reduce((a, b) => a + (b.pendingAmount || 0), 0),
        totalParties: res?.count || 0,
      });
    } catch (e) {
      console.log('LOAD REPORT ERROR:', e);
      Alert.alert('Error', 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [type]);

  console.log('Data', data);

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      {/* ================= HEADER ================= */}
      <Navbar title="Reports" page="report" />

      {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.safe}>
        {/* ================= TABS ================= */}
        <View style={styles.segment}>
          {['collection', 'payment'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.segmentBtn, type === t && styles.segmentActive]}
              onPress={() => setType(t)}
            >
              <Text
                style={[
                  styles.segmentText,
                  type === t && styles.segmentTextActive,
                ]}
              >
                {t === 'collection'
                  ? 'Pending Collections'
                  : 'Pending Payments'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ================= STATS ================= */}
        <View style={styles.kpiRow}>
          <KPI
            label={type === 'collection' ? 'Total Receivable' : 'Total Payable'}
            value={summary.totalAmount}
            color={type === 'collection' ? '#16A34A' : '#DC2626'}
          />
          <KPI label="Overdue" value={summary.overdueAmount} color="#DC2626" />
          {/* <KPI label="Parties" value={summary.totalParties} /> */}
        </View>

        {/* ================= EXPORT ================= */}
        <View style={styles.exportRow}>
          <ExportBtn label="PDF" />
          <ExportBtn label="Excel" />
        </View>

        {/* ================= LIST ================= */}
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View
                style={[
                  styles.sideBar,
                  {
                    backgroundColor:
                      type === 'collection' ? '#16A34A' : '#DC2626',
                  },
                ]}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {type === 'collection' ? item.clientName : item.vendorName}
                </Text>

                <Text style={styles.meta}>
                  {new Date(item.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>

                <View style={styles.cardFooter}>
                  <Text
                    style={[
                      styles.amount,
                      { color: type === 'collection' ? '#16A34A' : '#DC2626' },
                    ]}
                  >
                    ₹ {item.pendingAmount}
                  </Text>

                  <View style={styles.actions}>
                    {/* <IconBtn
                      icon="create-outline"
                      onPress={() => openEdit(item)}
                    />
                    <IconBtn
                      icon="trash-outline"
                      color="#DC2626"
                      onPress={() => deleteEntry(item)}
                    /> */}
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: '#F59E0B' + '20' },
                      ]}
                    >
                      <Text style={[styles.statusText]}>Pending</Text>
                    </View>
                    <View style={[styles.paymentMethod]}>
                      {item.paymentMethod === 'Cash' ? (
                        <Cash width={20} height={22} />
                      ) : item.paymentMethod === 'Bank' ? (
                        <GPay width={18} height={22} />
                      ) : (
                        <Idbi width={22} height={20} />
                      )}
                    </View>
                    {/* <IconBtn
                      icon="book-outline"
                      onPress={() =>
                        navigation.navigate('Ledger', {
                          client: item?.clientId,
                        })
                      }
                    /> */}
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      </View>

      <BottomNav navigation={navigation} active="report" />
    </View>
  );
};

/* ================= COMPONENTS ================= */

const KPI = ({ label, value, color = '#111' }) => (
  <View style={styles.kpi}>
    <Text style={[styles.kpiValue, { color }]}>₹ {value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const ExportBtn = ({ label }) => (
  <TouchableOpacity style={styles.exportBtn}>
    <Icon name="download-outline" size={18} />
    <Text style={{ fontWeight: '700' }}>{label}</Text>
  </TouchableOpacity>
);

const IconBtn = ({ icon, onPress, color = '#111' }) => (
  <TouchableOpacity style={styles.iconBtn} onPress={onPress}>
    <Icon name={icon} size={18} color={color} />
  </TouchableOpacity>
);

export default Report;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },

  safe: { flex: 1, backgroundColor: '#FAFBFC', paddingHorizontal: 16 },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },

  tabRow: { flexDirection: 'row', marginBottom: 16 },
  tab: {
    flex: 1,
    padding: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 8,
  },
  activeTab: { backgroundColor: '#111827' },
  tabText: { textAlign: 'center', fontWeight: '700' },
  activeTabText: { color: '#fff' },

  kpiRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kpi: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },

  exportRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginBottom: 14,
  },

  exportBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
    marginVertical: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    elevation: 3,
  },
  sideBar: {
    width: 5,
    borderRadius: 18,
    marginRight: 12,
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 20,
    fontWeight: '900',
  },

  name: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  iconBtn: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modalRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginBottom: 18,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#111827',
  },
  segmentText: {
    fontWeight: '700',
    color: '#374151',
  },
  segmentTextActive: {
    color: '#fff',
  },
  statusPill: {
    alignSelf: 'flex-start', // ✅ KEY: fit-content width
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'capitalize',
    color: '#F59E0B',
  },
  paymentMethod: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: '#f0f0f0ff',
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
