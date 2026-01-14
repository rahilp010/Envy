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
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import Navbar from '../components/Navbar';
import BottomNav from '../components/BottomNav';
import api from '../services/api';
import Loading from '../animation/Loading';

const WIDTH = Dimensions.get('window').width;

const Skeleton = ({ width, height, style }) => {
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
    outputRange: [-width, width], // ✅ width is number
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: '#E5E7EB',
          borderRadius: 12,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: width * 0.4,
          height: '100%',
          backgroundColor: '#F3F4F6',
          opacity: 0.6,
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const Analytics = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('month'); // month | lastMonth | year | custom
  const [tooltip, setTooltip] = useState(null);
  const pieAnim = useRef(new Animated.Value(0)).current;

  const getDateRange = () => {
    const now = new Date();

    let fromDate;
    let toDate = now;

    if (range === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (range === 'lastMonth') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      toDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (range === 'year') {
      fromDate = new Date(now.getFullYear(), 0, 1);
    }

    return fromDate
      ? {
          fromDate: fromDate.toISOString(),
          toDate: toDate.toISOString(),
        }
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

  /* ================= SAFE STATS ================= */

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

  /* ================= PIE DATA ================= */

  const pieData =
    totalCashAmount === 0 && totalBankAmount === 0
      ? [{ value: 1, color: '#E5E7EB', text: 'No Data' }]
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
        <AnalyticsSkeleton />
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

  return (
    <View style={styles.container}>
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
          <RefreshControl refreshing={refreshing} onRefresh={loadAnalytics} />
        }
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* ================= SUMMARY ================= */}
        <View style={styles.kpiRow}>
          <KPI label="Sales" value={`₹ ${totalSales.toFixed(2)}`} />
          <KPI label="Purchase" value={`₹ ${totalPurchase.toFixed(2)}`} />
          <KPI
            label="Profit"
            value={`₹ ${profit.toFixed(2)}`}
            color={profit >= 0 ? '#16A34A' : '#DC2626'}
          />
          <KPI label="Stock" value={data.counts.stock} />
        </View>
        {/* ================= SALES VS PURCHASE ================= */}
        <Text style={styles.section}>Sales vs Purchase</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={barData}
            barWidth={40}
            spacing={35}
            hideRules
            cappedBars
            capColor={'#aaaaaaff'}
            capThickness={4}
            showGradient
            gradientColor={'rgba(225, 221, 227, 0.8)'}
            yAxisLabelPrefix="₹"
            yAxisThickness={1}
            xAxisThickness={1}
            noOfSections={4}
            maxValue={Math.max(totalSales, totalPurchase) * 1.2 || 10}
            isAnimated
            animationDuration={800}
            yAxisTextStyle={{ color: '#6B7280', fontSize: 10, marginLeft: -30 }}
            xAxisLabelTextStyle={{ fontWeight: '900' }}
          />

          {/* TOOLTIP */}
          {tooltip && (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipTitle}>{tooltip.label}</Text>
              <Text style={styles.tooltipValue}>₹ {tooltip.value}</Text>

              <TouchableOpacity onPress={() => setTooltip(null)}>
                <Text style={styles.tooltipClose}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* ================= PAYMENT SPLIT ================= */}
        <Text style={styles.section}>Cash / Bank Split</Text>
        {pieData.length ? (
          <Animated.View
            style={[
              styles.pieCard,
              {
                opacity: pieAnim,
                transform: [
                  {
                    scale: pieAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <PieChart
              data={pieData}
              donut
              radius={95}
              innerRadius={60}
              focusOnPress
              isAnimated
              animationDuration={800}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerTitle}>Total</Text>
                  <Text style={styles.centerAmount}>₹ {totalPayment}</Text>
                </View>
              )}
            />

            {/* LEGEND */}
            <View style={styles.legendRow}>
              <LegendChip
                color="#22C55E"
                label="Cash"
                value={totalCashAmount}
              />
              <LegendChip
                color="#2563EB"
                label="Bank"
                value={totalBankAmount}
              />
            </View>
          </Animated.View>
        ) : (
          <Text style={styles.emptyText}>No payment data available</Text>
        )}

        {/* ================= STOCK ALERT ================= */}
        <Text style={styles.section}>Stock Prediction</Text>
        {data.stockPredictions.map(p => (
          <View key={p.productId} style={styles.stockRow}>
            <Text>{p.productName}</Text>
            <Text
              style={{
                fontWeight: '700',
                color:
                  p.risk === 'critical'
                    ? '#DC2626'
                    : p.risk === 'warning'
                    ? '#F59E0B'
                    : '#16A34A',
              }}
            >
              {Math.ceil(p.daysLeft)} days left
            </Text>
          </View>
        ))}
        {/* ================= EXPORTS ================= */}
        <Text style={styles.section}>Reports</Text>
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

/* ================= COMPONENTS ================= */

const KPI = ({ label, value, color = '#111827' }) => (
  <View style={styles.kpi}>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const LegendChip = ({ color, label, value }) => (
  <View style={styles.legendChip}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
    <Text style={styles.legendValue}>₹ {value}</Text>
  </View>
);

const AnalyticsSkeleton = () => {
  const CARD_WIDTH = (WIDTH - 16 * 3) / 2;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
      {/* KPI skeletons */}
      <View style={[styles.kpiRow, { gap: 15 }]}>
        <Skeleton width={CARD_WIDTH} height={90} />
        <Skeleton width={CARD_WIDTH} height={90} />
        <Skeleton width={CARD_WIDTH} height={90} />
        <Skeleton width={CARD_WIDTH} height={90} />
      </View>

      {/* Bar chart skeleton */}
      <View style={{ marginHorizontal: 16 }}>
        <Skeleton width={WIDTH - 32} height={240} style={{ marginTop: 8 }} />
      </View>

      {/* Stock rows */}
      <View style={{ marginTop: 24 }}>
        <Skeleton
          width={WIDTH - 32}
          height={50}
          style={{ marginHorizontal: 16 }}
        />
        <Skeleton
          width={WIDTH - 32}
          height={50}
          style={{ marginHorizontal: 16, marginTop: 10 }}
        />
        <Skeleton
          width={WIDTH - 32}
          height={50}
          style={{ marginHorizontal: 16, marginTop: 10 }}
        />
      </View>
    </ScrollView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFC' },

  section: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '800',
  },

  chart: {
    marginHorizontal: 16,
    borderRadius: 16,
  },

  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },

  kpi: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },

  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },

  kpiLabel: {
    marginTop: 4,
    color: '#6B7280',
    fontWeight: '600',
  },

  splitRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
  },

  exportBtn: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  exportText: {
    fontWeight: '700',
  },

  emptyText: {
    marginHorizontal: 16,
    color: '#6B7280',
  },

  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 36,
    paddingVertical: 20,
    borderRadius: 18,
    elevation: 2,
  },

  tooltip: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    elevation: 8,
  },

  tooltipTitle: {
    color: '#E5E7EB',
    fontSize: 12,
  },

  tooltipValue: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  tooltipClose: {
    marginTop: 6,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },

  pieCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 4,
  },

  centerLabel: {
    alignItems: 'center',
  },

  centerTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },

  centerAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 2,
  },

  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
  },

  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    elevation: 2,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 6,
  },

  legendLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginRight: 6,
  },

  legendValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
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
