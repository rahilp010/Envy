import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AlertBox({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  actionTextSuccess = '',
  actionTextDecline = '',
  type = 'info', // info | error | success
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  // const pulseAnim = useRef(new Animated.Value(1)).current;

  /* ---------- ENTRY ANIMATION ---------- */
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

      // 💓 ICON PULSE
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
      // pulseAnim.setValue(1);
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
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* ICON WITH PULSE */}
              <Animated.View
                style={[
                  styles.iconWrapper,
                  {
                    backgroundColor: icon.bg,
                  },
                ]}
              >
                <Icon name={icon.name} size={42} color={icon.color} />
              </Animated.View>

              <Text style={styles.title}>{title}</Text>
              {!!message && <Text style={styles.message}>{message}</Text>}

              {/* ACTION BUTTONS */}
              <View style={styles.actionButtons}>
                {!!actionTextDecline && (
                  <TouchableOpacity
                    style={[styles.btn, styles.outlineBtn]}
                    onPress={onClose}
                  >
                    <Text style={styles.outlineText}>{actionTextDecline}</Text>
                  </TouchableOpacity>
                )}

                {!!actionTextSuccess && (
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: icon.color }]}
                    onPress={onConfirm || onClose}
                  >
                    <Text style={styles.btnText}>{actionTextSuccess}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ================= STYLES ================= */

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

  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  btn: {
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 26,
    minWidth: 110,
    alignItems: 'center',
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  outlineBtn: {
    backgroundColor: '#F3F4F6',
  },

  outlineText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
});
