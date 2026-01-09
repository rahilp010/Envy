import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const PAYMENT_METHODS = [
  {
    id: 'gpay',
    label: 'Google Pay',
    icon: 'google-pay',
    requiresNextStep: true,
    size: 26,
  },
  {
    id: 'cash',
    label: 'Cash',
    icon: 'money-bill-wave-alt',
    requiresNextStep: true,
    size: 16,
  },
  {
    id: 'cheque',
    label: 'Cheque',
    icon: 'barcode',
    requiresNextStep: true,
    size: 20,
  },
  {
    id: 'client',
    label: 'Client to Client',
    icon: 'people-outline',
    requiresNextStep: true,
    size: 22,
  },
];

export default function PaymentModal({ visible, onClose, onSelect }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      {/* BACKDROP */}
      <Pressable style={styles.overlay} onPress={onClose} />

      {/* MODAL CARD */}
      <View style={styles.centerWrapper}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <Text style={styles.title}>Choose Payment Method</Text>

          {/* OPTIONS */}
          {PAYMENT_METHODS.map(item => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              style={styles.optionCard}
              onPress={() => onSelect(item)}
            >
              {/* LEFT ICON */}
              <View style={styles.iconWrapper}>
                {item.icon === 'money-bill-wave-alt' ||
                item.icon === 'google-pay' ||
                item.icon === 'barcode' ? (
                  <FontAwesome5
                    name={item.icon}
                    size={item.size}
                    color="#111827"
                  />
                ) : (
                  <Ionicons name={item.icon} size={item.size} color="#111827" />
                )}
              </View>

              {/* LABEL */}
              <Text style={styles.optionText}>{item.label}</Text>

              {/* RIGHT CHEVRON (conditional) */}
              {item.requiresNextStep && (
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,

    // Android shadow
    elevation: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 18,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,

    // subtle card lift
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});
