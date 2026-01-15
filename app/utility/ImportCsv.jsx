import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';

const ImportCsv = ({
  csvModalVisible,
  setCsvModalVisible,
  loadClients,
  loadProducts,
  csvText,
  active,
}) => {
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importErrors, setImportErrors] = React.useState([]);

  const parseCSV = text => {
    if (!text) return { headers: [], rows: [] };

    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());

    const rows = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());

      const obj = { __row: index + 2 };
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });

      return obj;
    });

    return { headers, rows };
  };

  const hasRowError = rowIndex =>
    importErrors.some(e => e.row === rowIndex + 2);

  let validateClientRow;
  let validateProductRow;

  switch (active) {
    case 'client':
      validateClientRow = row => {
        const errors = [];

        if (!row.clientName) errors.push('Client name is required');

        if (row.phoneNo && !/^\d{10}$/.test(row.phoneNo)) {
          errors.push('Phone must be 10 digits');
        }

        if (
          row.accountType &&
          !['Creditor', 'Debtor'].includes(row.accountType)
        ) {
          errors.push('AccountType must be Creditor or Debtor');
        }

        return errors;
      };
      break;

    case 'product':
      validateProductRow = row => {
        const errors = [];

        if (!row.productName) errors.push('Product name is required');

        if (row.productPrice && !/^[0-9.]+$/.test(row.productPrice)) {
          errors.push('Price must be a number');
        }

        return errors;
      };
      break;

    default:
      break;
  }

  const config =
    active === 'client'
      ? {
          validate: validateClientRow,
          importRow: row =>
            api.createClient({
              clientName: row.clientName?.toUpperCase(),
              phoneNo: Number(row.phoneNo || 0),
              gstNo: row.gstNo || '',
              address: row.address || '',
              pendingAmount: Number(row.pendingAmount || 0),
              paidAmount: Number(row.paidAmount || 0),
              pendingFromOurs: Number(row.pendingFromOurs || 0),
              accountType: row.accountType || 'Debtor',
              isEmployee: String(row.isEmployee).toLowerCase() === 'true',
              salary: Number(row.salary || 0),
            }),
        }
      : {
          validate: validateProductRow,
          importRow: row =>
            api.createProduct({
              productName: row.productName?.toUpperCase(),
              productPrice: Number(row.productPrice || 0),
              productQuantity: Number(row.productQuantity || 0),
              clientName: row.clientName || '',
              assetType: row.assetType || '',
              saleHSN: row.saleHSN || '',
              purchaseHSN: row.purchaseHSN || '',
              taxRate: Number(row.taxRate || 0),
              taxAmount: Number(row.taxAmount || 0),
              totalAmountWithTax: Number(row.totalAmountWithTax || 0),
              totalAmountWithoutTax: Number(row.totalAmountWithoutTax || 0),
              addParts: row.part || '',
            }),
        };

  const handleCSVImport = async () => {
    try {
      setImporting(true);
      setImportErrors([]);
      setImportProgress(0);

      const { rows } = parseCSV(csvText);
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const rowErrors = config.validate?.(row) ?? [];

        if (rowErrors.length) {
          errors.push({
            row: row.__row,
            errors: rowErrors,
          });
          continue;
        }

        await config.importRow(row);

        setImportProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setImportErrors(errors);

      if (!errors.length) {
        setCsvModalVisible(false);

        if (active === 'client' && typeof loadClients === 'function') {
          loadClients();
        }

        if (active === 'product' && typeof loadProducts === 'function') {
          loadProducts();
        }
      }
    } catch (e) {
      Alert.alert('Import failed', e.message);
    } finally {
      setImporting(false);
    }
  };

  const { headers, rows } = parseCSV(csvText);

  return (
    <View>
      <Modal visible={csvModalVisible} animationType="slide" transparent>
        <View style={styles.csvOverlay}>
          <View style={styles.csvModal}>
            {/* ===== HEADER ===== */}
            <View style={styles.csvHeader}>
              <View>
                <Text style={styles.csvTitle}>
                  Import {active === 'client' ? 'Clients' : 'Products'}
                </Text>
                <Text style={styles.csvSubtitle}>
                  Upload & validate CSV data before importing
                </Text>
              </View>

              <TouchableOpacity onPress={() => setCsvModalVisible(false)}>
                <Icon name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ===== INFO BAR ===== */}
            <View style={styles.csvInfoBar}>
              <Icon name="document-text-outline" size={18} color="#2563EB" />
              <Text style={styles.csvInfoText}>
                CSV loaded • {csvText.split('\n').length - 2} rows detected
              </Text>
            </View>

            {/* ===== CSV TABLE PREVIEW ===== */}
            <View style={styles.csvTableWrapper}>
              <ScrollView horizontal>
                <View>
                  {/* HEADER */}
                  <View style={[styles.csvRow, styles.csvHeaderRow]}>
                    <Text style={[styles.csvCell, styles.csvIndex]}>#</Text>
                    {headers.map((h, i) => (
                      <Text
                        key={i}
                        style={[styles.csvCell, styles.csvHeaderCell]}
                      >
                        {h}
                      </Text>
                    ))}
                  </View>

                  {/* ROWS */}
                  <ScrollView style={{ maxHeight: 220 }}>
                    {rows.map((row, rowIndex) => {
                      const isError = hasRowError(rowIndex);

                      return (
                        <View
                          key={rowIndex}
                          style={[styles.csvRow, isError && styles.csvErrorRow]}
                        >
                          <Text style={[styles.csvCell, styles.csvIndex]}>
                            {rowIndex + 1}
                          </Text>

                          {headers.map(h => (
                            <Text key={h} style={styles.csvCell}>
                              {row[h] || '—'}
                            </Text>
                          ))}
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </ScrollView>
            </View>

            {/* ===== PROGRESS ===== */}
            {importing && (
              <View style={styles.csvProgressBox}>
                <View style={styles.csvProgressBarBg}>
                  <View
                    style={[
                      styles.csvProgressBarFill,
                      { width: `${importProgress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.csvProgressText}>
                  Importing… {importProgress}%
                </Text>
              </View>
            )}

            {/* ===== ERRORS ===== */}
            {!!importErrors.length && (
              <View style={styles.csvErrorBox}>
                <Text style={styles.csvErrorTitle}>
                  ⚠ {importErrors.length} row(s) failed
                </Text>

                <ScrollView style={{ maxHeight: 120 }}>
                  {importErrors.map((e, i) => (
                    <Text key={i} style={styles.csvErrorText}>
                      Row {e.row}: {e.errors.join(', ')}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ===== FOOTER ===== */}
            <View style={styles.csvFooter}>
              <TouchableOpacity
                style={styles.csvCancelBtn}
                onPress={() => setCsvModalVisible(false)}
                disabled={importing}
              >
                <Text style={styles.csvCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.csvImportBtn}
                onPress={handleCSVImport}
                disabled={importing}
              >
                <Icon name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.csvImportText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ImportCsv;

const styles = StyleSheet.create({
  csvOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  csvModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },

  csvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  csvTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  csvSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  csvInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },

  csvInfoText: {
    fontSize: 13,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  csvPreviewBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    padding: 12,
    height: 180,
  },

  csvPreviewText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#111827',
    lineHeight: 18,
  },

  csvProgressBox: {
    marginTop: 16,
  },

  csvProgressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    overflow: 'hidden',
  },

  csvProgressBarFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },

  csvProgressText: {
    fontSize: 12,
    color: '#374151',
    marginTop: 6,
    textAlign: 'right',
  },

  csvErrorBox: {
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
  },

  csvErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 6,
  },

  csvErrorText: {
    fontSize: 12,
    color: '#7F1D1D',
    marginBottom: 4,
  },

  csvFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },

  csvCancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  csvCancelText: {
    fontWeight: '700',
    color: '#111827',
  },

  csvImportBtn: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },

  csvImportText: {
    color: '#fff',
    fontWeight: '700',
  },

  csvTableWrapper: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 8,
  },

  csvRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  csvHeaderRow: {
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 2,
    borderBottomColor: '#CBD5E1',
  },

  csvCell: {
    minWidth: 120,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#111827',
  },

  csvHeaderCell: {
    fontWeight: '800',
  },

  csvIndex: {
    width: 40,
    textAlign: 'center',
    fontWeight: '700',
    color: '#6B7280',
  },

  csvErrorRow: {
    backgroundColor: '#FEF2F2',
  },
});
