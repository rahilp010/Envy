/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import api from '../services/api';
import AlertBox from '../components/AlertBox';
import HapticFeedback from 'react-native-haptic-feedback';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

export default function Signup({ navigation }) {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  /* ===================== STATE ===================== */
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');

  // Animation Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const hapticOptions = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  };

  /* ===================== EFFECTS ===================== */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* ===================== ANIMATION LOGIC ===================== */
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /* ===================== VALIDATION ===================== */
  const isNameValid = name.trim().length >= 2;
  const isEmailValid = email.includes('@') && email.includes('.');
  const isPasswordValid = password.length >= 6;
  const isPhoneValid = phone.trim().length >= 8;

  /* ===================== HANDLERS ===================== */
  const handleSignup = async () => {
    try {
      if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid) {
        shake();
        HapticFeedback.trigger('notificationError', hapticOptions);
        setModalData({
          title: 'Invalid Credentials',
          message: 'Please check your credentials',
          type: 'error',
        });
        setModalVisible(true);
        return;
      }

      await api.signup({ name, email, password, phone });

      HapticFeedback.trigger('notificationSuccess', hapticOptions);
      setModalData({
        title: 'Account Created',
        message: 'You can now login with your credentials',
        type: 'success',
      });
      setModalVisible(true);

      // Navigate after delay
      setTimeout(() => {
        setModalVisible(false);
        navigation.replace('Login');
      }, 1500);
    } catch (err) {
      shake();
      HapticFeedback.trigger('notificationError', hapticOptions);
      setModalData({
        title: 'Signup Failed',
        message: err?.response?.data?.message || 'Something went wrong',
        type: 'error',
      });
      setModalVisible(true);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={COLORS.bg}
      />

      {/* === BACKGROUND ATMOSPHERE (MATCHING LANDING/LOGIN) === */}
      <View style={StyleSheet.absoluteFill}>
        <PulseCircle style={styles.circlePurple} color="#DDD6FE" delay={0} />
        <PulseCircle style={styles.circlePink} color="#FBCFE8" delay={800} />
        <PulseCircle style={styles.circleRed} color="#ffb1aaff" delay={1600} />
        <PulseCircle style={styles.circleBlue} color="#CDEAFE" delay={2400} />
      </View>

      {/* MAIN CONTENT */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Icon name="person-add" size={28} color={COLORS.bg} />
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your finance today</Text>
        </View>

        {/* FORM INPUTS */}
        <View style={styles.formGroup}>
          {/* Name Input */}
          <View style={[styles.inputWrapper, { marginBottom: 16 }]}>
            <Icon
              name="person-outline"
              size={20}
              color={COLORS.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
            />
            {isNameValid && (
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          {/* Email Input */}
          <View style={[styles.inputWrapper, { marginBottom: 16 }]}>
            <Icon
              name="mail-outline"
              size={20}
              color={COLORS.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            {isEmailValid && (
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          {/* Phone Input */}
          <View style={[styles.inputWrapper, { marginBottom: 16 }]}>
            <Icon
              name="call-outline"
              size={20}
              color={COLORS.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
              style={styles.input}
            />
            {isPhoneValid && (
              <Icon name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Icon
              name="lock-closed-outline"
              size={20}
              color={COLORS.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Create Password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Min. 6 characters</Text>
        </View>

        {/* SIGNUP BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSignup}
          style={[styles.primaryBtn]}
        >
          <Text style={styles.primaryText}>Sign Up</Text>
          <View style={styles.btnIconCircle}>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.signupText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* ALERT BOX */}
        <AlertBox
          visible={modalVisible}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
          onClose={() => setModalVisible(false)}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/* ================= PULSE ANIMATION ================= */
const PulseCircle = ({ style, delay = 0, color }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { backgroundColor: color, opacity, transform: [{ scale }] },
      ]}
    />
  );
};

/* ================= STYLES ================= */
const createStyles = COLORS =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.bg, // Matches Landing BG #F9FAFB
      justifyContent: 'center',
    },

    // === BACKGROUND CIRCLES ===
    circlePurple: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      top: -60,
      right: -80,
    },
    circlePink: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      top: 150,
      left: -60,
    },
    circleRed: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      bottom: 100,
      right: -80,
    },
    circleBlue: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      bottom: -50,
      left: -80,
    },

    // === CONTENT WRAPPER ===
    content: { padding: 24, zIndex: 10 },

    // Header
    header: { alignItems: 'center', marginBottom: 32 },
    logoBadge: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: COLORS.text, // Solid contrast block
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: COLORS.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: COLORS.text,
      marginBottom: 6,
      letterSpacing: -0.5,
    },
    subtitle: { fontSize: 16, color: COLORS.muted },

    // Inputs
    formGroup: { marginBottom: 16 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      borderRadius: 20,
      backgroundColor: COLORS.card,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.03)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    input: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '500' },
    helperText: {
      marginTop: 6,
      fontSize: 12,
      color: COLORS.muted,
      marginLeft: 8,
    },

    // Button
    primaryBtn: {
      height: 60,
      borderRadius: 999,
      backgroundColor: COLORS.text, // Solid #111827
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginTop: 24,
      marginBottom: 24,
      shadowColor: COLORS.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    primaryBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
    primaryText: { color: COLORS.bg, fontSize: 18, fontWeight: '700' },
    btnIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Footer
    footerContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    footerText: { color: COLORS.muted, fontSize: 15 },
    signupText: { color: COLORS.text, fontWeight: '800', fontSize: 15 },
  });
