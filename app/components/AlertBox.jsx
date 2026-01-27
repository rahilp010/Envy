import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AlertBox({
  visible,
  title,
  message,
  onClose,
  actionText = 'OK',
  type = 'info', // info | error | success
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [visible]);

  if (!visible) return null;

  const ICON_CONFIG = {
    info: {
      name: 'information-circle',
      color: '#2563EB',
      bg: '#DBEAFE',
    },
    success: {
      name: 'checkmark-circle',
      color: '#16A34A',
      bg: '#DCFCE7',
    },
    error: {
      name: 'close-circle',
      color: '#DC2626',
      bg: '#FEE2E2',
    },
  };

  const icon = ICON_CONFIG[type] || ICON_CONFIG.info;

  return (
    <Modal transparent visible animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* ICON */}
          <View style={[styles.iconWrapper, { backgroundColor: icon.bg }]}>
            <Icon name={icon.name} size={42} color={icon.color} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: icon.color }]}
            onPress={onClose}
          >
            <Text style={styles.btnText}>{actionText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },

  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },

  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },

  btn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 56,
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
