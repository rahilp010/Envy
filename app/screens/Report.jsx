/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Navbar from '../components/Navbar';
import api from '../services/api';
import Cash from '../../assets/cash.svg';
import GPay from '../../assets/googlepay.svg';
import Idbi from '../../assets/IDBIBank.svg';
import Loading from '../animation/Loading';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

const Report = ({ navigation, route }) => {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

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

  // Animation for entering the screen
  const translateAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.spring(translateAnim, {
      toValue: 0,
      friction: 6,
      useNativeDriver: true,
    }).start();
  }, []);

  /* ===================== LOAD DATA ===================== */
  const loadData = async () => {
    try {
      setLoading(true);
      const res =
        type === 'collection'
          ? await api.getPendingCollections()
          : await api.getPendingPayments();

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

  /* ===================== RENDER HELPERS ===================== */

  const KPI = ({ label, value, color }) => (
    <View style={styles.kpi}>
      <Text style={[styles.kpiValue, { color: color || COLORS.text }]}>
        ₹ {value.toLocaleString('en-IN')}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );

  const ExportBtn = ({ label }) => (
    <TouchableOpacity style={styles.exportBtn} activeOpacity={0.7}>
      <Icon name="download-outline" size={16} color={COLORS.text} />
      <Text style={styles.exportText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />
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

      <Animated.View
        style={[styles.safe, { transform: [{ translateY: translateAnim }] }]}
      >
        {/* ================= TABS ================= */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              type === 'collection' && styles.segmentActive,
            ]}
            onPress={() => setType('collection')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'collection' && styles.segmentTextActive,
              ]}
            >
              Pending Collections
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              type === 'payment' && styles.segmentActive,
            ]}
            onPress={() => setType('payment')}
          >
            <Text
              style={[
                styles.segmentText,
                type === 'payment' && styles.segmentTextActive,
              ]}
            >
              Pending Payments
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= STATS ================= */}
        <View style={styles.kpiRow}>
          <KPI
            label={type === 'collection' ? 'Total To Receive' : 'Total To Pay'}
            value={summary.totalAmount}
            color={type === 'collection' ? '#10B981' : '#EF4444'}
          />
          <KPI
            label="Overdue (>30 Days)"
            value={summary.overdueAmount}
            color="#EF4444"
          />
        </View>

        {/* ================= EXPORT ================= */}
        <View style={styles.exportRow}>
          <Text style={styles.sectionTitle}>{data.length} Transactions</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ExportBtn label="PDF" />
            <ExportBtn label="CSV" />
          </View>
        </View>

        {/* ================= LIST ================= */}
        <FlatList
          data={data}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Colored Indicator Bar */}
              <View
                style={[
                  styles.sideBar,
                  {
                    backgroundColor:
                      type === 'collection' ? '#10B981' : '#EF4444',
                  },
                ]}
              />

              <View style={styles.cardContent}>
                {/* Header: Name & Date */}
                <View style={styles.cardRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {type === 'collection' ? item.clientName : item.vendorName}
                  </Text>
                  <Text style={styles.meta}>
                    {new Date(item.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>

                {/* Body: Amount & Actions */}
                <View style={[styles.cardRow, { marginTop: 6 }]}>
                  <Text
                    style={[
                      styles.amount,
                      { color: type === 'collection' ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    ₹ {item.pendingAmount.toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.actions}>
                    {/* Payment Method Icon */}
                    <View style={styles.paymentMethod}>
                      {item.paymentMethod === 'Cash' ? (
                        <Cash width={16} height={16} />
                      ) : item.paymentMethod === 'Bank' ? (
                        <GPay width={16} height={16} />
                      ) : (
                        <Idbi width={18} height={16} />
                      )}
                    </View>

                    {/* Status Pill */}
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>Pending</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        />
      </Animated.View>

      <BottomNav navigation={navigation} active="report" />
    </View>
  );
};

export default Report;

/* ================= STYLES ================= */

const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    safe: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },

    // === Tabs ===
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderRadius: 30,
      padding: 3,
      marginBottom: 10,
      // Soft shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 4,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 26,
    },
    segmentActive: {
      borderWidth: 1,
      borderColor: '#e3e9ffff',
      backgroundColor: '#F5F7FF', // Slight contrast for active
    },
    segmentText: {
      fontWeight: '600',
      color: COLORS.muted,
      fontSize: 14,
    },
    segmentTextActive: {
      color: COLORS.text,
      fontWeight: '700',
    },

    // === KPI ===
    kpiRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 24,
    },
    kpi: {
      flex: 1,
      backgroundColor: COLORS.card,
      padding: 16,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
      justifyContent: 'center',
    },
    kpiValue: {
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 4,
    },
    kpiLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.muted,
      textTransform: 'uppercase',
    },

    // === Export & Title ===
    exportRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    exportBtn: {
      backgroundColor: COLORS.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    exportText: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.text,
    },

    // === Card ===
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderRadius: 20,
      marginBottom: 14,
      overflow: 'hidden',
      // Soft shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    sideBar: {
      width: 6,
    },
    cardContent: {
      flex: 1,
      padding: 16,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.text,
      flex: 1,
      marginRight: 10,
    },
    meta: {
      fontSize: 12,
      color: COLORS.muted,
      fontWeight: '500',
    },
    amount: {
      fontSize: 18,
      fontWeight: '800',
    },

    // === Action Pills ===
    actions: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    paymentMethod: {
      width: 28,
      height: 28,
      borderRadius: 10,
      backgroundColor: '#F3F4F6', // Keep light even in dark mode for contrast with icons? Or adapt.
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      backgroundColor: 'rgba(245, 158, 11, 0.15)', // Orange tint
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#F59E0B',
    },

    // === Modal ===
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
