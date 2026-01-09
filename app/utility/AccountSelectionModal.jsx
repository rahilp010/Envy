import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AccountSelectionModal({
  visible,
  accounts = [],
  onClose,
  onSelect,
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Account</Text>

          <FlatList
            data={accounts}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.accountRow}
                onPress={() => onSelect(item)}
              >
                <Icon name="card-outline" size={20} color="#111827" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.accountName}>{item.accountName}</Text>
                  <Text style={styles.accountMeta}>
                    Balance ₹{item.currentBalance}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 18,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  accountMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
