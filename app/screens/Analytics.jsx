/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import Loading from '../animation/Loading';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

const WIDTH = Dimensions.get('window').width;

// === SKELETON LOADER ===
const Skeleton = ({ width, height, style, COLORS }) => {
  const styles = createStyles(COLORS);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.skeletonBase, { width, height }, style]}>
      <Animated.View
        style={[
          styles.skeletonOverlay,
          { width: width * 0.4, transform: [{ translateX }] },
        ]}
      />
    </View>
  );
};

const Analytics = ({ navigation }) => {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  /* ===================== STATE ===================== */
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('month'); // month | lastMonth | year | custom
  const [tooltip, setTooltip] = useState(null);
  const pieAnim = useRef(new Animated.Value(0)).current;

  /* ===================== DATA LOGIC ===================== */
  const getDateRange = () => {
    const now = new Date();
    let fromDate,
      toDate = now;

    if (range === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'lastMonth') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (range === 'year') {
      fromDate = new Date(now.getFullYear(), 0, 1);
    }

    return fromDate
      ? { fromDate: fromDate.toISOString(), toDate: toDate.toISOString() }
      : {};
  };

  const loadAnalytics = async () => {
    try {
      pieAnim.setValue(0);
      setLoading(true);
      setRefreshing(true);
      const { fromDate, toDate } = getDateRange();
      const res = await api.getAnalytics({ fromDate, toDate });
      setData(res);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  /* ===================== CALCULATIONS ===================== */
  const totalSales = Number(data?.sales?.total ?? 0);
  const totalPurchase = Number(data?.purchases?.total ?? 0);
  const profit = totalSales - totalPurchase;

  const cashAmountSales = Number(data?.sales?.byPayment?.Cash ?? 0);
  const bankAmountSales = Number(data?.sales?.byPayment?.Bank ?? 0);
  const cashAmountPurchase = Number(data?.purchases?.byPayment?.Cash ?? 0);
  const bankAmountPurchase = Number(data?.purchases?.byPayment?.Bank ?? 0);

  const totalCashAmount = cashAmountSales + cashAmountPurchase;
  const totalBankAmount = bankAmountSales + bankAmountPurchase;
  const totalPayment = totalCashAmount + totalBankAmount;

  /* ===================== CHARTS ===================== */
  const pieData =
    totalCashAmount === 0 && totalBankAmount === 0
      ? [{ value: 1, color: COLORS.border, text: 'No Data' }]
      : [
          totalCashAmount > 0 && {
            value: totalCashAmount,
            color: '#22C55E',
            text: 'Cash',
          },
          totalBankAmount > 0 && {
            value: totalBankAmount,
            color: '#2563EB',
            text: 'Bank',
            focused: true,
          },
        ].filter(Boolean);

  useEffect(() => {
    if (pieData?.length > 0) {
      pieAnim.setValue(0);
      Animated.timing(pieAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [pieData?.length]);

  if (!data || !data.sales || !data.purchases) {
    return (
      <View style={styles.container}>
        <Navbar title="Analytics" />
        <AnalyticsSkeleton COLORS={COLORS} />
        <BottomNav navigation={navigation} />
      </View>
    );
  }

  const barData = [
    {
      value: Number(totalSales || 0),
      label: 'Sales',
      frontColor: '#22C55E',
      onPress: () => setTooltip({ label: 'Sales', value: totalSales }),
    },
    {
      value: Number(totalPurchase || 0),
      label: 'Purchase',
      frontColor: '#2563EB',
      onPress: () => setTooltip({ label: 'Purchase', value: totalPurchase }),
    },
  ];

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.bg}
      />
      <Navbar title="Analytics" page="analytics" />

      {loading && !data && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAnalytics}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SUMMARY KPIs */}
        <View style={styles.kpiRow}>
          <KPI
            label="Sales"
            value={`₹ ${totalSales.toFixed(2)}`}
            COLORS={COLORS}
          />
          <KPI
            label="Purchase"
            value={`₹ ${totalPurchase.toFixed(2)}`}
            COLORS={COLORS}
          />
          <KPI
            label="Profit"
            value={`₹ ${profit.toFixed(2)}`}
            color={profit >= 0 ? '#16A34A' : '#DC2626'}
            COLORS={COLORS}
          />
          <KPI label="Stock" value={data.counts.stock} COLORS={COLORS} />
        </View>

        {/* BAR CHART */}
        <Text style={styles.sectionTitle}>Sales vs Purchase</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={barData}
            barWidth={40}
            spacing={35}
            hideRules
            cappedBars
            capColor={COLORS.muted}
            capThickness={4}
            showGradient
            gradientColor={COLORS.bg} // Subtle gradient to bg
            yAxisLabelPrefix="₹"
            yAxisThickness={0}
            xAxisThickness={0}
            noOfSections={4}
            maxValue={Math.max(totalSales, totalPurchase) * 1.2 || 10}
            isAnimated
            animationDuration={800}
            yAxisTextStyle={{
              color: COLORS.muted,
              fontSize: 10,
              marginLeft: -10,
            }}
            xAxisLabelTextStyle={{
              fontWeight: '700',
              color: COLORS.text,
              marginTop: 4,
            }}
            labelWidth={40}
          />

          {tooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipTitle}>{tooltip.label}</Text>
              <Text style={styles.tooltipValue}>
                ₹ {tooltip.value.toLocaleString('en-IN')}
              </Text>
              <TouchableOpacity onPress={() => setTooltip(null)}>
                <Text style={styles.tooltipClose}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* PIE CHART */}
        <Text style={styles.sectionTitle}>Payment Distribution</Text>
        {pieData.length ? (
          <Animated.View
            style={[
              styles.pieCard,
              { opacity: pieAnim, transform: [{ scale: pieAnim }] },
            ]}
          >
            <PieChart
              data={pieData}
              donut
              radius={90}
              innerRadius={65}
              focusOnPress
              isAnimated
              animationDuration={800}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerTitle}>Total</Text>
                  <Text style={styles.centerAmount}>
                    ₹ {totalPayment.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}
            />
            {/* LEGEND */}
            <View style={styles.legendRow}>
              <LegendChip
                color="#22C55E"
                label="Cash"
                value={totalCashAmount}
                COLORS={COLORS}
              />
              <LegendChip
                color="#2563EB"
                label="Bank"
                value={totalBankAmount}
                COLORS={COLORS}
              />
            </View>
          </Animated.View>
        ) : (
          <Text style={styles.emptyText}>No payment data available</Text>
        )}

        {/* STOCK PREDICTIONS */}
        <Text style={styles.sectionTitle}>Stock Alerts</Text>
        {data.stockPredictions.map(p => (
          <View key={p.productId} style={styles.stockRow}>
            <Text style={styles.stockName}>{p.productName}</Text>
            <Text
              style={[
                styles.stockDays,
                {
                  color:
                    p.risk === 'critical'
                      ? '#DC2626'
                      : p.risk === 'warning'
                      ? '#F59E0B'
                      : '#16A34A',
                },
              ]}
            >
              {Math.ceil(p.daysLeft)} days left
            </Text>
          </View>
        ))}

        {/* EXPORTS */}
        <Text style={styles.sectionTitle}>Reports</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={api.openSalesPDF}>
          <Text style={styles.exportText}>Export Sales PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportBtn} onPress={api.openSalesExcel}>
          <Text style={styles.exportText}>Export Sales Excel</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav navigation={navigation} active="analytics" />
    </View>
  );
};

export default Analytics;

/* ================= SUB-COMPONENTS ================= */

const KPI = ({ label, value, color, COLORS }) => {
  const styles = createStyles(COLORS);
  return (
    <View style={styles.kpi}>
      <Text style={[styles.kpiValue, { color: color || COLORS.text }]}>
        {value}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
};

const LegendChip = ({ color, label, value, COLORS }) => {
  const styles = createStyles(COLORS);
  return (
    <View style={styles.legendChip}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>₹ {value.toLocaleString('en-IN')}</Text>
    </View>
  );
};

const AnalyticsSkeleton = ({ COLORS }) => {
  const styles = createStyles(COLORS);
  const CARD_WIDTH = (WIDTH - 48) / 2; // 16 padding * 3 gaps

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={[styles.kpiRow, { gap: 12 }]}>
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} width={CARD_WIDTH} height={100} COLORS={COLORS} />
        ))}
      </View>
      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Skeleton width={WIDTH - 32} height={260} COLORS={COLORS} />
      </View>
      <View style={{ marginTop: 24, marginHorizontal: 16 }}>
        {[1, 2, 3].map(i => (
          <Skeleton
            key={i}
            width={WIDTH - 32}
            height={60}
            style={{ marginBottom: 12 }}
            COLORS={COLORS}
          />
        ))}
      </View>
    </ScrollView>
  );
};

/* ================= STYLES ================= */

const createStyles = COLORS =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },

    // Headings
    sectionTitle: {
      marginHorizontal: 16,
      marginTop: 24,
      marginBottom: 12,
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    // KPI
    kpiRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      padding: 16,
      gap: 12,
    },
    kpi: {
      width: '48%',
      backgroundColor: COLORS.card,
      padding: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
      marginBottom: 0,
    },
    kpiValue: { fontSize: 20, fontWeight: '800' },
    kpiLabel: {
      marginTop: 4,
      color: COLORS.muted,
      fontWeight: '600',
      fontSize: 12,
    },

    // Charts
    chartCard: {
      backgroundColor: COLORS.card,
      marginHorizontal: 16,
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    pieCard: {
      backgroundColor: COLORS.card,
      marginHorizontal: 16,
      borderRadius: 24,
      paddingVertical: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },

    // Pie Internals
    centerLabel: { alignItems: 'center' },
    centerTitle: { fontSize: 12, color: COLORS.muted, fontWeight: '600' },
    centerAmount: {
      fontSize: 16,
      fontWeight: '800',
      color: COLORS.text,
      marginTop: 2,
    },
    legendRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    legendChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.bg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    legendLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: COLORS.muted,
      marginRight: 6,
    },
    legendValue: { fontSize: 12, fontWeight: '800', color: COLORS.text },

    // Stock Rows
    stockRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: COLORS.card,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
    stockName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    stockDays: { fontWeight: '800', fontSize: 13 },

    // Tooltip
    tooltip: {
      position: 'absolute',
      top: 10,
      right: 10,
      backgroundColor: COLORS.text,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      elevation: 8,
      zIndex: 10,
    },
    tooltipTitle: { color: COLORS.bg, fontSize: 12, opacity: 0.8 },
    tooltipValue: {
      color: COLORS.bg,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 2,
    },
    tooltipClose: {
      marginTop: 6,
      fontSize: 11,
      color: COLORS.bg,
      textAlign: 'right',
      opacity: 0.6,
    },

    // Exports
    exportBtn: {
      backgroundColor: COLORS.card,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    exportText: { fontWeight: '700', color: COLORS.text },
    emptyText: {
      marginHorizontal: 16,
      color: COLORS.muted,
      fontStyle: 'italic',
    },

    // Modal & Skeleton
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loaderBox: { backgroundColor: COLORS.card, padding: 24, borderRadius: 20 },
    skeletonBase: {
      backgroundColor: COLORS.border,
      borderRadius: 16,
      overflow: 'hidden',
    },
    skeletonOverlay: {
      height: '100%',
      backgroundColor: COLORS.card,
      opacity: 0.5,
    },
  });
