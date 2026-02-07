/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../../services/api';
import { useTheme } from '../../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../../theme/color';
import Navbar from '../Navbar';
import { launchImageLibrary } from 'react-native-image-picker';

export default function PersonalInfo({ navigation }) {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  /* ===================== STATE ===================== */
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: null,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  /* ===================== EFFECTS ===================== */
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    AsyncStorage.getAllKeys().then(keys => {
      console.log('STORAGE KEYS:', keys);
    });
  }, []);

  console.log('AuthUser', AsyncStorage.getItem('authUser'));

  const normalizeUser = u => ({
    _id: u._id,
    name: u.name || '',
    email: u.email || '',
    phone: u.phone || '',
    avatar: u.avatar || null,
  });

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('authUser');

      if (storedUser) {
        const parsed = normalizeUser(JSON.parse(storedUser));
        setUser(parsed);
      } else {
        const accountList = await api.getAllAccounts();
        if (accountList?.length) {
          const normalized = normalizeUser(accountList[0]);
          setUser(normalized);
          await AsyncStorage.setItem('authUser', JSON.stringify(normalized));
        }
      }
    } catch (e) {
      console.log('Failed to load user', e);
    } finally {
      setInitialLoading(false);
    }
  };

  /* ===================== HANDLERS ===================== */
  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
      selectionLimit: 1,
    });

    if (!result.didCancel && result.assets?.length) {
      const uri = result.assets[0].uri;
      const updatedUser = { ...user, avatar: uri };
      setUser(updatedUser);
      // Ideally upload image to server here
      await AsyncStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const saveProfile = async () => {
    if (!user.name.trim() || !user.phone.trim()) {
      Alert.alert('Missing Info', 'Name and Phone Number are required.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
      };

      // ✅ PASS ID SEPARATELY
      const updated = await api.updateProfile(user._id, payload);

      const updatedUser = {
        ...user,
        ...updated,
      };

      await AsyncStorage.setItem('authUser', JSON.stringify(updatedUser));

      Alert.alert('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.bg}
      />
      <Navbar title="Personal Info" page="profileInfo" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* AVATAR SECTION */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              {user.avatar ? (
                <Image
                  source={{ uri: user.avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: COLORS.primary },
                  ]}
                >
                  <Text style={styles.avatarInitial}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Icon name="camera" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarLabel}>Tap to change photo</Text>
          </View>

          {/* FORM FIELDS */}
          <View style={styles.formContainer}>
            {/* NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputBox}>
                <Icon
                  name="person-outline"
                  size={20}
                  color={COLORS.muted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={user.name}
                  onChangeText={v => setUser({ ...user, name: v })}
                  style={styles.input}
                  placeholder="Your Name"
                  placeholderTextColor={COLORS.muted}
                />
              </View>
            </View>

            {/* PHONE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputBox}>
                <Icon
                  name="call-outline"
                  size={20}
                  color={COLORS.muted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={user.phone}
                  onChangeText={v => setUser({ ...user, phone: v })}
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* EMAIL (DISABLED) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputBox]}>
                <Icon
                  name="mail-outline"
                  size={20}
                  color={COLORS.muted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  value={user.email}
                  editable={false}
                  style={[styles.input]} // Dim text
                />
                <Icon
                  name="lock-closed-outline"
                  size={16}
                  color={COLORS.muted}
                />
              </View>
              <Text style={styles.helperText}>Email cannot be changed.</Text>
            </View>

            {/* PASSWORD BUTTON */}
            <TouchableOpacity
              style={styles.passwordBtn}
              onPress={() => setShowPasswordModal(true)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.passwordIconBox}>
                  <Icon name="key-outline" size={18} color={COLORS.primary} />
                </View>
                <Text style={styles.passwordBtnText}>Change Password</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={saveProfile}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* MODAL */}
        <PasswordModal
          visible={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          COLORS={COLORS}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

/* ================= PASSWORD MODAL ================= */
function PasswordModal({ visible, onClose, COLORS }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!current || !next || !confirm)
      return Alert.alert('Error', 'All fields required');
    if (next !== confirm)
      return Alert.alert('Error', 'New passwords do not match');

    try {
      setLoading(true);
      await api.changePassword({ currentPassword: current, newPassword: next });
      Alert.alert('Success', 'Password updated successfully');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, { backgroundColor: COLORS.card }]}>
          <Text style={[modalStyles.title, { color: COLORS.text }]}>
            Change Password
          </Text>

          <TextInput
            placeholder="Current Password"
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
            placeholderTextColor={COLORS.muted}
            style={[
              modalStyles.input,
              { color: COLORS.text, borderColor: COLORS.border },
            ]}
          />
          <TextInput
            placeholder="New Password"
            secureTextEntry
            value={next}
            onChangeText={setNext}
            placeholderTextColor={COLORS.muted}
            style={[
              modalStyles.input,
              { color: COLORS.text, borderColor: COLORS.border },
            ]}
          />
          <TextInput
            placeholder="Confirm Password"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            placeholderTextColor={COLORS.muted}
            style={[
              modalStyles.input,
              { color: COLORS.text, borderColor: COLORS.border },
            ]}
          />

          <View style={modalStyles.actions}>
            <TouchableOpacity onPress={onClose} style={modalStyles.cancelBtn}>
              <Text style={{ color: COLORS.muted, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              style={[modalStyles.saveBtn, { backgroundColor: COLORS.primary }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scrollContent: {
      paddingBottom: 40,
    },

    // Avatar
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    avatarWrapper: {
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 4,
      borderColor: COLORS.card,
      position: 'relative',
      // Shadow
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 55,
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 55,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 42,
      fontWeight: '800',
      color: '#fff',
    },
    cameraBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#111827',
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: COLORS.bg,
    },
    avatarLabel: {
      marginTop: 12,
      color: COLORS.primary,
      fontSize: 14,
      fontWeight: '600',
    },

    // Form
    formContainer: {
      paddingHorizontal: 24,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 8,
      marginLeft: 4,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      height: 56,
      borderRadius: 16,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
      // Soft shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
      elevation: 2,
    },
    disabledBox: {
      backgroundColor: COLORS.bg, // Darker/Lighter than card to show disabled
      opacity: 0.8,
      borderColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: COLORS.text,
      fontWeight: '500',
    },
    helperText: {
      fontSize: 12,
      color: COLORS.muted,
      marginTop: 6,
      marginLeft: 4,
    },

    // Password Button
    passwordBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.card,
      padding: 16,
      borderRadius: 16,
      marginTop: 10,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    passwordIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: 'rgba(99, 102, 241, 0.1)', // Light primary tint
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    passwordBtnText: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.text,
    },

    // Footer
    footer: {
      padding: 24,
      backgroundColor: COLORS.bg,
    },
    saveBtn: {
      backgroundColor: COLORS.primary,
      height: 56,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    saveText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
