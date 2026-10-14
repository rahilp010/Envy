import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AppHeader from '../components/common/AppHeader';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Loader from '../components/common/Loader';
import {
  CustomInput,
  CustomButton,
  CustomSelect,
} from '../components/common/CustomControls';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import { query, execute } from '../database/db';
import { getAllAccounts, getNominalAccount, recalculateLedgerBalances } from '../database/handlers/accountHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SalaryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  // Pay Salary Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [monthName, setMonthName] = useState(
    new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  );

  const loadData = useCallback(async () => {
    try {
      const [empData, accs] = await Promise.all([
        query("SELECT * FROM clients WHERE isEmployee = 1 ORDER BY clientName ASC"),
        getAllAccounts(),
      ]);
      setEmployees(empData || []);
      const liquidAccs = accs.filter((a) => ['Bank', 'Cash', 'GPay'].includes(a.accountType));
      setBankAccounts(liquidAccs || []);
      if (liquidAccs.length > 0) setSelectedBankId(liquidAccs[0].id);
    } catch (err) {
      console.warn('Salary screen load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const bankOptions = useMemo(
    () =>
      bankAccounts.map((b) => ({
        label: `${b.accountName} (₹${b.closingBalance || 0})`,
        value: b.id,
      })),
    [bankAccounts]
  );

  const totalMonthlyPayroll = useMemo(() => {
    return employees.reduce((sum, e) => sum + Number(e.salary || 0), 0);
  }, [employees]);

  const openPayModal = (employee) => {
    setSelectedEmployee(employee);
    setSalaryAmount(String(employee.salary || ''));
    setModalVisible(true);
  };

  const handleDisburseSalary = async () => {
    const amt = parseFloat(salaryAmount);
    if (!amt || amt <= 0) {
      showErrorToast('Error', 'Please enter a valid salary amount');
      return;
    }
    if (!selectedBankId) {
      showErrorToast('Error', 'Please select a payout account');
      return;
    }

    try {
      const bankAcc = bankAccounts.find((b) => b.id === selectedBankId);
      const salaryExpenseAcc = await getNominalAccount('Salary Expense', 'Expense');

      const refId = `SALARY-${Date.now()}`;
      const narration = `Salary payout for ${selectedEmployee.clientName} (${monthName})`;

      // 1. Debit Salary Expense nominal account
      await execute(
        `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
         VALUES (?, null, 'debit', ?, 0, 'Salary', ?, ?, CURRENT_TIMESTAMP)`,
        [salaryExpenseAcc.id, amt, refId, narration]
      );

      // 2. Credit Bank/Cash account (Asset decreases)
      await execute(
        `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
         VALUES (?, null, 'credit', ?, 0, 'Salary', ?, ?, CURRENT_TIMESTAMP)`,
        [selectedBankId, amt, refId, narration]
      );

      // 3. Update Employee's salaryHistory in clients table
      let existingHistory = [];
      try {
        existingHistory = JSON.parse(selectedEmployee.salaryHistory || '[]');
      } catch {
        existingHistory = [];
      }

      existingHistory.unshift({
        amount: amt,
        month: monthName,
        date: new Date().toISOString(),
        paymentAccount: bankAcc?.accountName || 'Bank',
        refId,
      });

      await execute(
        'UPDATE clients SET salaryHistory = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [JSON.stringify(existingHistory), selectedEmployee.id]
      );

      await recalculateLedgerBalances(salaryExpenseAcc.id);
      await recalculateLedgerBalances(selectedBankId);

      showSuccessToast('Salary Disbursed', `₹${amt} paid to ${selectedEmployee.clientName}`);
      setModalVisible(false);
      loadData();
    } catch (err) {
      showErrorToast('Payout Error', err.message);
    }
  };

  const formatCurrency = (val) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="Staff & Payroll"
        subtitle={`${employees.length} employees on roster`}
        rightActions={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('Clients')}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={18} color="#16161b" />
            <Text style={styles.addBtnText}>Add Staff</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Total Monthly Payroll Banner */}
        <Card style={styles.bannerCard}>
          <Text style={styles.bannerLabel}>ESTIMATED MONTHLY PAYROLL</Text>
          <Text style={styles.bannerValue}>{formatCurrency(totalMonthlyPayroll)}</Text>
          <Text style={styles.bannerSub}>Total base monthly salary for all active staff</Text>
        </Card>

        {loading ? (
          <Loader message="Loading Payroll Records..." />
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card
                style={styles.empCard}
                title={item.clientName}
                subtitle={item.phoneNo ? `Phone: ${item.phoneNo}` : 'Staff Member'}
                badge="EMPLOYEE"
                badgeColor="rgba(192, 132, 252, 0.15)"
                badgeTextColor="#c084fc"
                icon={<MaterialCommunityIcons name="badge-account-outline" size={20} color="#c084fc" />}
                rightAction={
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => openPayModal(item)}
                  >
                    <MaterialCommunityIcons name="cash-fast" size={16} color="#16161b" />
                    <Text style={styles.payBtnText}>Pay Salary</Text>
                  </TouchableOpacity>
                }
              >
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Base Monthly Salary:</Text>
                  <Text style={styles.metricValue}>{formatCurrency(item.salary)}</Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="badge-account-outline"
                title="No Employee Accounts"
                description="Mark clients as staff members in the Clients module to manage payroll here."
                actionLabel="Go to Clients Catalog"
                onAction={() => navigation.navigate('Clients')}
              />
            }
          />
        )}
      </View>

      {/* Disburse Salary Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Disburse Staff Salary</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.modalEmpName}>
                Staff Member: <Text style={{ color: '#daf4aa' }}>{selectedEmployee?.clientName}</Text>
              </Text>

              <CustomInput
                label="Payroll Month / Period"
                value={monthName}
                onChangeText={setMonthName}
                icon="calendar-month-outline"
              />

              <CustomSelect
                label="Disbursement Bank/Cash Account *"
                value={selectedBankId}
                items={bankOptions}
                onValueChange={setSelectedBankId}
              />

              <CustomInput
                label="Disbursement Amount (₹) *"
                placeholder="0.00"
                keyboardType="numeric"
                value={salaryAmount}
                onChangeText={setSalaryAmount}
                icon="currency-inr"
              />

              <CustomButton
                title="Pay Salary & Post Expense"
                onPress={handleDisburseSalary}
                style={{ marginTop: 14, marginBottom: 20 }}
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#16161b',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  bannerCard: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderColor: 'rgba(192, 132, 252, 0.25)',
    marginVertical: 4,
    padding: 16,
  },
  bannerLabel: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  bannerSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 24,
  },
  empCard: {
    marginVertical: 4,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#daf4aa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  payBtnText: {
    color: '#16161b',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  metricValue: {
    color: '#4ade80',
    fontSize: 15,
    fontWeight: '800',
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
    maxHeight: 450,
  },
  modalEmpName: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 14,
  },
});
