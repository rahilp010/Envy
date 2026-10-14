import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useDispatch } from 'react-redux';
import { setAuth } from '../app/features/envySlice';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Day 1 Screens
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ClientListScreen from '../screens/ClientListScreen';

// Day 2 Screens
import TransactionScreen from '../screens/TransactionScreen';
import PurchaseScreen from '../screens/PurchaseScreen';
import LedgerReportScreen from '../screens/LedgerReportScreen';
import PendingCollectionScreen from '../screens/PendingCollectionScreen';
import PendingPaymentsScreen from '../screens/PendingPaymentsScreen';
import SalaryScreen from '../screens/SalaryScreen';
import BankManagementScreen from '../screens/BankManagementScreen';
import AccountListScreen from '../screens/AccountListScreen';
import BankLedgerScreen from '../screens/BankLedgerScreen';
import TransferAmountScreen from '../screens/TransferAmountScreen';

// Day 3 Screens
import SalesInvoiceScreen from '../screens/SalesInvoiceScreen';
import PurchaseBillScreen from '../screens/PurchaseBillScreen';
import TodaysAnalyticsScreen from '../screens/TodaysAnalyticsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ActionLogsScreen from '../screens/ActionLogsScreen';
import WarrantyScreen from '../screens/WarrantyScreen';
import InvoiceStudioScreen from '../screens/InvoiceStudioScreen';
import CurrencyConverterScreen from '../screens/CurrencyConverterScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', icon: 'view-dashboard-outline', label: 'Dashboard' },
    ],
  },
  {
    title: 'INVENTORY & PARTIES',
    items: [
      { name: 'Products', icon: 'cube-outline', label: 'Products Catalog' },
      { name: 'Clients', icon: 'account-group-outline', label: 'Clients & Parties' },
    ],
  },
  {
    title: 'SALES & BILLING',
    items: [
      { name: 'Sales', icon: 'cart-arrow-up', label: 'Sales Transactions', iconColor: '#daf4aa' },
      { name: 'SalesInvoice', icon: 'receipt-outline', label: 'Sales Invoices' },
      { name: 'PendingCollection', icon: 'arrow-bottom-left', label: 'Pending Collections' },
      { name: 'TodaysAnalytics', icon: 'chart-timeline-variant', label: "Today's Analytics" },
    ],
  },
  {
    title: 'PURCHASES & EXPENSES',
    items: [
      { name: 'Purchase', icon: 'cart-arrow-down', label: 'Purchases', iconColor: '#f472b6' },
      { name: 'PurchaseBill', icon: 'file-document-outline', label: 'Purchase Bills' },
      { name: 'PendingPayment', icon: 'arrow-top-right', label: 'Pending Payments' },
    ],
  },
  {
    title: 'FINANCIALS & ACCOUNTS',
    items: [
      { name: 'Ledger', icon: 'book-open-outline', label: 'General Ledger' },
      { name: 'BankManagement', icon: 'bank', label: 'Bank Management' },
      { name: 'Accounts', icon: 'format-list-bulleted', label: 'Account List' },
      { name: 'BankLedger', icon: 'bank-transfer', label: 'Bank Ledger' },
      { name: 'TransferAmount', icon: 'swap-horizontal', label: 'Transfer Funds' },
      { name: 'Salary', icon: 'cash-multiple', label: 'Payroll & Salaries' },
    ],
  },
  {
    title: 'SYSTEM & TOOLS',
    items: [
      { name: 'Analytics', icon: 'chart-bar', label: 'Analytics' },
      { name: 'Reports', icon: 'chart-pie', label: 'Financial Reports' },
      { name: 'ActionLogs', icon: 'clipboard-text-clock-outline', label: 'Audit Logs' },
      { name: 'Warranty', icon: 'shield-check-outline', label: 'Warranty' },
      { name: 'InvoiceStudio', icon: 'palette-outline', label: 'Invoice Studio' },
      { name: 'CurrencyConverter', icon: 'currency-usd', label: 'Currency Converter' },
      { name: 'Settings', icon: 'cog-outline', label: 'Settings' },
    ],
  },
];

function CustomDrawerContent(props) {
  const dispatch = useDispatch();
  const currentRouteName = props.state.routeNames[props.state.index];

  const handleLogout = () => {
    dispatch(setAuth(false));
    props.navigation.replace('Auth');
  };

  return (
    <View style={styles.drawerRoot}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoPill}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#daf4aa" />
        </View>
        <View style={styles.brandTextWrapper}>
          <Text style={styles.brandTitle}>ENVY ERP</Text>
          <Text style={styles.brandSubtitle}>v1.0 • Mobile Edition</Text>
        </View>
      </View>

      <DrawerContentScrollView {...props} style={styles.drawerScroll}>
        {NAV_SECTIONS.map((sec, idx) => (
          <View key={idx} style={styles.sectionBlock}>
            <Text style={styles.sectionHeader}>{sec.title}</Text>
            {sec.items.map((item) => {
              const isActive = currentRouteName === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.navItem, isActive ? styles.navItemActive : null]}
                  onPress={() => props.navigation.navigate(item.name)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={isActive ? '#daf4aa' : item.iconColor || '#94a3b8'}
                    style={styles.navIcon}
                  />
                  <Text style={[styles.navLabel, isActive ? styles.navLabelActive : null]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </DrawerContentScrollView>

      {/* Footer / Logout */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={18} color="#f43f5e" />
          <Text style={styles.logoutText}>Lock App / Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: '#16161b',
          width: '82%',
          maxWidth: 320,
        },
      }}
    >
      {/* Day 1 Screens */}
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Products" component={ProductsScreen} />
      <Drawer.Screen name="Clients" component={ClientListScreen} />

      {/* Day 2 Screens */}
      <Drawer.Screen name="Sales" component={TransactionScreen} />
      <Drawer.Screen name="Purchase" component={PurchaseScreen} />
      <Drawer.Screen name="Ledger" component={LedgerReportScreen} />
      <Drawer.Screen name="PendingCollection" component={PendingCollectionScreen} />
      <Drawer.Screen name="PendingPayment" component={PendingPaymentsScreen} />
      <Drawer.Screen name="Salary" component={SalaryScreen} />
      <Drawer.Screen name="BankManagement" component={BankManagementScreen} />
      <Drawer.Screen name="Accounts" component={AccountListScreen} />
      <Drawer.Screen name="BankLedger" component={BankLedgerScreen} />
      <Drawer.Screen name="TransferAmount" component={TransferAmountScreen} />

      {/* Day 3 Screens */}
      <Drawer.Screen name="SalesInvoice" component={SalesInvoiceScreen} />
      <Drawer.Screen name="PurchaseBill" component={PurchaseBillScreen} />
      <Drawer.Screen name="TodaysAnalytics" component={TodaysAnalyticsScreen} />
      <Drawer.Screen name="Analytics" component={AnalyticsScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
      <Drawer.Screen name="ActionLogs" component={ActionLogsScreen} />
      <Drawer.Screen name="Warranty" component={WarrantyScreen} />
      <Drawer.Screen name="InvoiceStudio" component={InvoiceStudioScreen} />
      <Drawer.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
    backgroundColor: '#16161b',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandTextWrapper: {},
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  drawerScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionBlock: {
    marginTop: 14,
    marginBottom: 4,
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 1,
  },
  navItemActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
  },
  navIcon: {
    marginRight: 12,
  },
  navLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#daf4aa',
    fontWeight: '700',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
});
