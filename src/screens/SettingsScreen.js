import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../components/common/AppHeader';
import Loader from '../components/common/Loader';
import {
  getCompanyProfile,
  updateCompanyProfile,
} from '../database/handlers/settingsHandlers';
import {
  getTaxes,
  createTax,
  deleteTax,
} from '../database/handlers/taxHandlers';
import {
  getDatabaseStats,
  exportDatabaseToJson,
  importDatabaseFromJson,
} from '../services/backupService';
import { shareContent } from '../services/shareService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('company');

  // Company Profile State
  const [company, setCompany] = useState({
    companyName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    website: '',
    bankName: '',
    bankAccNo: '',
    bankIfsc: '',
    bankBranch: '',
    terms: '',
  });

  // Taxes State
  const [taxes, setTaxes] = useState([]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxValue, setNewTaxValue] = useState('');

  // DB Stats State
  const [dbStats, setDbStats] = useState({});

  // Restore Modal State
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [prof, taxList, stats] = await Promise.all([
        getCompanyProfile(),
        getTaxes(),
        getDatabaseStats(),
      ]);
      if (prof) setCompany(prof);
      setTaxes(taxList || []);
      setDbStats(stats || {});
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveCompany = async () => {
    try {
      await updateCompanyProfile(company);
      Alert.alert('Success', 'Company profile and invoice letterhead updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleAddTax = async () => {
    if (!newTaxName.trim()) {
      Alert.alert('Error', 'Please enter tax name (e.g. GST 18%)');
      return;
    }
    try {
      await createTax({ taxName: newTaxName, taxValue: newTaxValue });
      setNewTaxName('');
      setNewTaxValue('');
      const updated = await getTaxes();
      setTaxes(updated || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDeleteTax = async (id) => {
    Alert.alert('Delete Tax', 'Are you sure you want to delete this tax rate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTax(id);
          const updated = await getTaxes();
          setTaxes(updated || []);
        },
      },
    ]);
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseToJson();
      await shareContent('ENVY_ERP_Database_Backup.json', json);
    } catch (err) {
      Alert.alert('Export Error', err.message);
    }
  };

  const handleImportBackup = async () => {
    if (!restoreJson.trim()) {
      Alert.alert('Error', 'Please paste the backup JSON content');
      return;
    }
    try {
      await importDatabaseFromJson(restoreJson);
      setRestoreModalVisible(false);
      setRestoreJson('');
      Alert.alert('Restored', 'Database backup successfully restored!');
      loadData();
    } catch (err) {
      Alert.alert('Restore Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Settings"
        subtitle="Branding, Taxes & Database Diagnostics"
        leftAction="menu"
      />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'company' && styles.tabActive]}
          onPress={() => setActiveTab('company')}
        >
          <Text style={[styles.tabText, activeTab === 'company' && styles.tabTextActive]}>
            Company
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'taxes' && styles.tabActive]}
          onPress={() => setActiveTab('taxes')}
        >
          <Text style={[styles.tabText, activeTab === 'taxes' && styles.tabTextActive]}>
            Tax Rates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'backup' && styles.tabActive]}
          onPress={() => setActiveTab('backup')}
        >
          <Text style={[styles.tabText, activeTab === 'backup' && styles.tabTextActive]}>
            Database
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loader fullScreen={false} message="Loading configuration..." />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === 'company' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>BUSINESS INFORMATION</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Company / Store Name</Text>
                  <TextInput
                    style={styles.input}
                    value={company.companyName}
                    onChangeText={(val) => setCompany({ ...company, companyName: val })}
                    placeholder="ENVY ERP"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.label}>Tagline</Text>
                  <TextInput
                    style={styles.input}
                    value={company.tagline}
                    onChangeText={(val) => setCompany({ ...company, tagline: val })}
                    placeholder="Industrial Solutions"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.label}>Official Address</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={company.address}
                    multiline
                    onChangeText={(val) => setCompany({ ...company, address: val })}
                    placeholder="Address for Invoices"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Phone No</Text>
                    <TextInput
                      style={styles.input}
                      value={company.phone}
                      onChangeText={(val) => setCompany({ ...company, phone: val })}
                      placeholder="Contact Number"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={company.email}
                      onChangeText={(val) => setCompany({ ...company, email: val })}
                      placeholder="Email"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputBox, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>GSTIN</Text>
                    <TextInput
                      style={styles.input}
                      value={company.gstin}
                      onChangeText={(val) => setCompany({ ...company, gstin: val })}
                      placeholder="GST Number"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={[styles.inputBox, { flex: 1 }]}>
                    <Text style={styles.label}>PAN</Text>
                    <TextInput
                      style={styles.input}
                      value={company.pan}
                      onChangeText={(val) => setCompany({ ...company, pan: val })}
                      placeholder="PAN Number"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>BANKING DETAILS FOR INVOICES</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={company.bankName}
                    onChangeText={(val) => setCompany({ ...company, bankName: val })}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputBox, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.label}>Account Number</Text>
                    <TextInput
                      style={styles.input}
                      value={company.bankAccNo}
                      onChangeText={(val) => setCompany({ ...company, bankAccNo: val })}
                      placeholder="Account No"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={[styles.inputBox, { flex: 0.8 }]}>
                    <Text style={styles.label}>IFSC Code</Text>
                    <TextInput
                      style={styles.input}
                      value={company.bankIfsc}
                      onChangeText={(val) => setCompany({ ...company, bankIfsc: val })}
                      placeholder="IFSC"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>

                <View style={styles.inputBox}>
                  <Text style={styles.label}>Terms & Conditions</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    value={company.terms}
                    multiline
                    onChangeText={(val) => setCompany({ ...company, terms: val })}
                    placeholder="Printed on invoices"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveCompany}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="content-save-outline" size={18} color="#0f172a" />
                <Text style={styles.saveBtnText}>Save Company Profile</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 2: TAX RATES */}
          {activeTab === 'taxes' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>ADD NEW TAX RATE</Text>
                <View style={styles.row}>
                  <View style={[styles.inputBox, { flex: 1.5, marginRight: 8 }]}>
                    <Text style={styles.label}>Tax Name</Text>
                    <TextInput
                      style={styles.input}
                      value={newTaxName}
                      onChangeText={setNewTaxName}
                      placeholder="e.g. GST 18%"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={[styles.inputBox, { flex: 0.8, marginRight: 8 }]}>
                    <Text style={styles.label}>Rate (%)</Text>
                    <TextInput
                      style={styles.input}
                      value={newTaxValue}
                      onChangeText={setNewTaxValue}
                      keyboardType="numeric"
                      placeholder="18"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.addTaxBtn}
                    onPress={handleAddTax}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>CONFIGURED TAX RATES ({taxes.length})</Text>
                {taxes.map((t) => (
                  <View key={t.id} style={styles.taxRow}>
                    <View>
                      <Text style={styles.taxName}>{t.taxName}</Text>
                      <Text style={styles.taxRate}>{t.taxValue}% GST</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteTax(t.id)} style={styles.delTaxBtn}>
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: DATABASE BACKUP */}
          {activeTab === 'backup' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardHeader}>OFFLINE DATABASE STATS</Text>
                <Text style={styles.subtext}>SQLite engine with WAL journaling & integrity</Text>
                <View style={styles.statsGrid}>
                  {Object.entries(dbStats).map(([tbl, count]) => (
                    <View key={tbl} style={styles.statPill}>
                      <Text style={styles.statTbl}>{tbl}</Text>
                      <Text style={styles.statCount}>{count}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>DATA BACKUP & RESTORE</Text>
                <Text style={styles.subtext}>
                  Export entire SQLite tables to a standalone JSON file, or restore from a previously exported backup.
                </Text>

                <View style={{ marginTop: 14, gap: 10 }}>
                  <TouchableOpacity
                    style={styles.backupBtn}
                    onPress={handleExportBackup}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="cloud-download-outline" size={20} color="#0f172a" />
                    <Text style={styles.backupBtnText}>Export Full JSON Backup</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={() => setRestoreModalVisible(true)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="#cbd5e1" />
                    <Text style={styles.restoreBtnText}>Restore from JSON</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeader}>SECURITY & ACCESS</Text>
                <Text style={styles.subtext}>
                  Master Access Passcode is configured as <Text style={{ color: '#daf4aa', fontWeight: 'bold' }}>123123</Text>.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Restore Modal */}
      <Modal visible={restoreModalVisible} animationType="slide" transparent={false} onRequestClose={() => setRestoreModalVisible(false)}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalNav}>
            <TouchableOpacity onPress={() => setRestoreModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Restore Database</Text>
          </View>
          <View style={{ padding: 16, flex: 1 }}>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
              Paste your exported JSON database backup text below:
            </Text>
            <TextInput
              style={styles.jsonInput}
              value={restoreJson}
              onChangeText={setRestoreJson}
              placeholder="Paste backup JSON..."
              placeholderTextColor="#64748b"
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleImportBackup}>
              <Text style={styles.saveBtnText}>Execute Restore</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#161d2d',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(218, 244, 170, 0.15)',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#daf4aa',
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#daf4aa',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  addTaxBtn: {
    backgroundColor: '#daf4aa',
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  taxName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  taxRate: {
    color: '#94a3b8',
    fontSize: 11,
  },
  delTaxBtn: {
    padding: 6,
  },
  subtext: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  statPill: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTbl: {
    color: '#94a3b8',
    fontSize: 11,
  },
  statCount: {
    color: '#daf4aa',
    fontSize: 11,
    fontWeight: '700',
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#daf4aa',
    paddingVertical: 12,
    borderRadius: 10,
  },
  backupBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 10,
  },
  restoreBtnText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalNav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  jsonInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    textAlignVertical: 'top',
    fontSize: 11,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
