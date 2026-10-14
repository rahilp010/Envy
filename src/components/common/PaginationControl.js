import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PaginationControl({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        Page {currentPage} of {totalPages || 1} {totalItems ? `(${totalItems} items)` : ''}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, currentPage <= 1 ? styles.btnDisabled : null]}
          disabled={currentPage <= 1}
          onPress={() => onPageChange(currentPage - 1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={20}
            color={currentPage <= 1 ? '#64748b' : '#ffffff'}
          />
        </TouchableOpacity>

        <View style={styles.pagePill}>
          <Text style={styles.pagePillText}>{currentPage}</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, currentPage >= totalPages ? styles.btnDisabled : null]}
          disabled={currentPage >= totalPages}
          onPress={() => onPageChange(currentPage + 1)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={currentPage >= totalPages ? '#64748b' : '#ffffff'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 8,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#262732',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  pagePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    marginHorizontal: 8,
  },
  pagePillText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '700',
  },
});
