import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export function CustomInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  icon,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style,
}) {
  return (
    <View style={[styles.inputGroup, style]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          !editable ? styles.inputDisabled : null,
          multiline ? { height: numberOfLines * 24 + 24 } : null,
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={18}
            color="#94a3b8"
            style={styles.inputIcon}
          />
        ) : null}
        <TextInput
          style={[styles.textInput, multiline ? styles.multilineInput : null]}
          value={value !== null && value !== undefined ? String(value) : ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function CustomButton({
  title,
  onPress,
  variant = 'primary', // primary | secondary | danger | outline
  size = 'medium', // small | medium | large
  icon,
  loading = false,
  disabled = false,
  style,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          container: styles.btnPrimary,
          text: styles.btnTextPrimary,
        };
      case 'secondary':
        return {
          container: styles.btnSecondary,
          text: styles.btnTextSecondary,
        };
      case 'danger':
        return {
          container: styles.btnDanger,
          text: styles.btnTextDanger,
        };
      case 'outline':
        return {
          container: styles.btnOutline,
          text: styles.btnTextOutline,
        };
      default:
        return {
          container: styles.btnPrimary,
          text: styles.btnTextPrimary,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.btnBase,
        vStyles.container,
        size === 'small' ? styles.btnSmall : size === 'large' ? styles.btnLarge : null,
        disabled || loading ? styles.btnDisabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon ? (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={vStyles.text.color}
          style={styles.btnIcon}
        />
      ) : null}
      <Text style={[styles.btnTextBase, vStyles.text]}>
        {loading ? 'Please wait...' : title}
      </Text>
    </TouchableOpacity>
  );
}

export function CustomSelect({
  label,
  value,
  onValueChange,
  items = [], // Array of { label, value }
  placeholder = 'Select an option',
  error,
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((i) => i.value === value);

  return (
    <View style={styles.inputGroup}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.inputContainer, styles.selectContainer, error ? styles.inputError : null]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.textInput, !selectedItem ? styles.placeholderText : null]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#94a3b8" />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item, index) => String(item.value || index)}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected ? styles.optionSelected : null]}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <MaterialCommunityIcons name="check" size={18} color="#daf4aa" />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export function CustomToggle({ label, value, onValueChange, subtitle }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {subtitle ? <Text style={styles.toggleSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={onValueChange}
        trackColor={{ false: '#334155', true: '#7c3aed' }}
        thumbColor={value ? '#daf4aa' : '#94a3b8'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1b22',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  selectContainer: {
    justifyContent: 'space-between',
  },
  inputError: {
    borderColor: '#f43f5e',
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#15151a',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  placeholderText: {
    color: '#64748b',
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 11,
    marginTop: 4,
  },
  btnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 18,
  },
  btnSmall: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnLarge: {
    height: 54,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnIcon: {
    marginRight: 8,
  },
  btnTextBase: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnPrimary: {
    backgroundColor: '#7c3aed',
  },
  btnTextPrimary: {
    color: '#ffffff',
  },
  btnSecondary: {
    backgroundColor: '#262732',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  btnTextSecondary: {
    color: '#f8fafc',
  },
  btnDanger: {
    backgroundColor: '#e11d48',
  },
  btnTextDanger: {
    color: '#ffffff',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  btnTextOutline: {
    color: '#a78bfa',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#20212a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  optionSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  optionText: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#daf4aa',
    fontWeight: '700',
  },
});
