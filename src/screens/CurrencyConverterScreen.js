import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToInr: 1.0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToInr: 86.8 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToInr: 94.2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToInr: 110.5 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToInr: 23.63 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rateToInr: 12.0 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToInr: 0.58 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateToInr: 63.4 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$', rateToInr: 56.7 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToInr: 66.2 },
];

export default function CurrencyConverterScreen({ navigation }) {
  const [amount, setAmount] = useState('1000');
  const [fromCurrency, setFromCurrency] = useState(CURRENCIES[0]); // INR
  const [toCurrency, setToCurrency] = useState(CURRENCIES[1]); // USD

  const parsedAmt = parseFloat(amount) || 0;
  // Convert from currency -> INR -> to currency
  const inInr = parsedAmt * fromCurrency.rateToInr;
  const converted = inInr / toCurrency.rateToInr;

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Currency Converter"
        subtitle="Global Exchange Rates & Calculator"
        leftAction="menu"
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Converter Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>AMOUNT TO CONVERT</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.symbolPrefix}>{fromCurrency.symbol}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Currency Switcher */}
          <View style={styles.currencyRow}>
            {/* From */}
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>From Currency</Text>
              <View style={styles.codePill}>
                <Text style={styles.codeText}>{fromCurrency.code}</Text>
                <Text style={styles.currNameText}>{fromCurrency.name}</Text>
              </View>
            </View>

            {/* Swap Button */}
            <TouchableOpacity onPress={handleSwap} style={styles.swapBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color="#0f172a" />
            </TouchableOpacity>

            {/* To */}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.subLabel}>To Currency</Text>
              <View style={[styles.codePill, { alignItems: 'flex-end' }]}>
                <Text style={styles.codeText}>{toCurrency.code}</Text>
                <Text style={styles.currNameText}>{toCurrency.name}</Text>
              </View>
            </View>
          </View>

          {/* Converted Big Result */}
          <View style={styles.resultBox}>
            <Text style={styles.resultSub}>CONVERTED ESTIMATE</Text>
            <Text style={styles.resultAmount}>
              {toCurrency.symbol} {converted.toFixed(2)}
            </Text>
            <Text style={styles.rateHint}>
              1 {fromCurrency.code} = {(fromCurrency.rateToInr / toCurrency.rateToInr).toFixed(4)} {toCurrency.code}
            </Text>
          </View>
        </View>

        {/* Currency Select Chips */}
        <View style={styles.selectorCard}>
          <Text style={styles.cardHeader}>QUICK CURRENCY SELECTOR</Text>
          <View style={styles.chipsWrap}>
            {CURRENCIES.map((c) => {
              const isSelected = toCurrency.code === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.currChip, isSelected && styles.currChipActive]}
                  onPress={() => setToCurrency(c)}
                >
                  <Text style={[styles.chipCode, isSelected && styles.chipCodeActive]}>
                    {c.code}
                  </Text>
                  <Text style={styles.chipSym}>{c.symbol}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Multi-Currency Rates Table */}
        <View style={styles.selectorCard}>
          <Text style={styles.cardHeader}>COMMON CONVERSIONS (FOR ₹{parsedAmt.toFixed(0)})</Text>
          {CURRENCIES.filter((c) => c.code !== 'INR').map((c) => {
            const val = (parsedAmt * fromCurrency.rateToInr) / c.rateToInr;
            return (
              <View key={c.code} style={styles.tableRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.tblCode}>{c.code}</Text>
                  <Text style={styles.tblName}>{c.name}</Text>
                </View>
                <Text style={styles.tblVal}>
                  {c.symbol} {val.toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  card: {
    backgroundColor: '#161d2d',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.15)',
  },
  cardHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  symbolPrefix: {
    color: '#daf4aa',
    fontSize: 22,
    fontWeight: '800',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  codePill: {},
  codeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  currNameText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  swapBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#daf4aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  resultBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  resultSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultAmount: {
    color: '#daf4aa',
    fontSize: 26,
    fontWeight: '800',
    marginVertical: 4,
  },
  rateHint: {
    color: '#94a3b8',
    fontSize: 11,
  },
  selectorCard: {
    backgroundColor: '#161d2d',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  currChipActive: {
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
    borderColor: '#daf4aa',
  },
  chipCode: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
  },
  chipCodeActive: {
    color: '#daf4aa',
  },
  chipSym: {
    color: '#64748b',
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  tblCode: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  tblName: {
    color: '#64748b',
    fontSize: 11,
  },
  tblVal: {
    color: '#daf4aa',
    fontSize: 13,
    fontWeight: '700',
  },
});
