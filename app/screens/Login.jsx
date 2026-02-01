/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AlertBox from '../components/AlertBox';
import HapticFeedback from 'react-native-haptic-feedback';
import Loading from '../animation/Loading';
import { useTheme } from '../theme/ThemeContext';
import { DarkTheme, LightTheme } from '../theme/color';

const { width, height } = Dimensions.get('window');

export default function Auth({ navigation }) {
  /* ===================== THEME ===================== */
  const { theme } = useTheme();
  const COLORS = theme === 'dark' ? DarkTheme : LightTheme;
  const styles = createStyles(COLORS);

  /* ===================== STATE ===================== */
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const shadowOpacityAnim = useRef(new Animated.Value(0)).current;

  // Alerts
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({
    title: '',
    message: '',
    type: 'info',
    actionTextSuccess: '',
  });

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),

      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),

      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 60,
        useNativeDriver: true,
      }),

      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 60,
        useNativeDriver: true,
      }),

      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const isEmailValid = value.includes('@') && value.includes('.');
  const isPhoneValid = value.length >= 10;
  const isPasswordValid = password.length >= 6;

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
      Animated.timing(shadowOpacityAnim, {
        toValue: 0.25,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setReady(true);
    });
  }, []);

  /* ===================== HANDLERS ===================== */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (mode === 'phone') {
        Alert.alert(
          'Coming Soon',
          'Phone login is currently under development.',
        );
        setLoading(false);
        return;
      }

      const res = await api.login({
        email: value.trim().toLowerCase(),
        password,
      });

      if (!res?.token) throw new Error('Token missing');

      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('username', res.user.name);
      await AsyncStorage.setItem('lastPasswordAuth', Date.now().toString());

      HapticFeedback.trigger('notificationSuccess', hapticOptions);
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomePage' }],
      });
    } catch (err) {
      shake();
      HapticFeedback.trigger('notificationError', hapticOptions);
      setModalData({
        title: 'Login Failed',
        message: err?.message || 'Invalid credentials',
        type: 'error',
        actionTextSuccess: 'Retry',
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
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
        backgroundColor={COLORS.transparent}
      />

      {/* === BACKGROUND ATMOSPHERE (MATCHING LANDING PAGE) === */}
      <View style={StyleSheet.absoluteFill}>
        <PulseCircle style={styles.circlePurple} color="#DDD6FE" delay={0} />
        <PulseCircle style={styles.circlePink} color="#FBCFE8" delay={800} />
        <PulseCircle style={styles.circleRed} color="#ffb1aaff" delay={1600} />
        <PulseCircle style={styles.circleBlue} color="#CDEAFE" delay={2400} />
      </View>

      {/* LOADING OVERLAY */}
      {loading && (
        <Modal transparent animationType="fade" visible>
          <View style={styles.overlay}>
            <View style={styles.loaderBox}>
              <Loading />
            </View>
          </View>
        </Modal>
      )}

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
            <Icon name="cube" size={28} color={COLORS.bg} />
          </View>
          <Text
            style={styles.title}
            onLongPress={() => {
              HapticFeedback.trigger('impactMedium', hapticOptions);
              navigation.navigate('Signup');
            }}
          >
            Welcome Back
          </Text>
          <Text style={styles.subtitle}>Sign in to manage your finance</Text>
        </View>

        {/* TOGGLE */}
        <View style={styles.toggleWrapper}>
          {['email', 'phone'].map(type => (
            <TouchableOpacity
              key={type}
              activeOpacity={0.9}
              onPress={() => {
                setMode(type);
                setValue('');
                setPassword('');
                HapticFeedback.trigger('selection', hapticOptions);
              }}
              style={[styles.toggleBtn, mode === type && styles.toggleActive]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === type && styles.toggleTextActive,
                ]}
              >
                {type === 'email' ? 'Email' : 'Phone'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FORM INPUTS */}
        <View style={styles.formGroup}>
          {/* Input 1: Email/Phone */}
          <View style={styles.inputWrapper}>
            <Icon
              name={mode === 'phone' ? 'call-outline' : 'mail-outline'}
              size={20}
              color={COLORS.muted}
              style={{ marginRight: 12 }}
            />
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={mode === 'phone' ? 'Phone Number' : 'Email Address'}
              placeholderTextColor={COLORS.muted}
              keyboardType={mode === 'phone' ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              style={styles.input}
            />

            {(mode === 'phone' ? isPhoneValid : isEmailValid) && (
              <View style={styles.checkCircle}>
                <Text style={styles.check}>✓</Text>
              </View>
            )}
          </View>
        </View>

        {mode === 'email' && (
          <View style={styles.formGroup}>
            {/* Input 2: Password */}
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
                placeholder="Password"
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

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOGIN BUTTON (Solid Dark Style) */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryText}>
            {mode === 'phone' ? 'Send Code' : 'Sign In'}
          </Text>
          <View style={styles.btnIconCircle}>
            <Icon name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}> Need access ?</Text>
          <TouchableOpacity
            onPress={() => {
              setModalData({
                title: 'Contact Envy',
                message: 'Please contact Envy support to create an account.',
                type: 'info',
                actionTextSuccess: 'Ok',
              });
              setModalVisible(true);
            }}
          >
            <Text style={styles.signupText}> Contact Envy</Text>
          </TouchableOpacity>
        </View>

        {/* ALERT BOX */}
        <AlertBox
          visible={modalVisible}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
          actionTextSuccess={modalData.actionTextSuccess}
          onClose={() => setModalVisible(false)}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

/* ================= PULSE ANIMATION COMPONENT ================= */
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

    // === BACKGROUND CIRCLES (Exact positions from Landing Page) ===
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
    content: {
      padding: 24,
      zIndex: 10,
    },

    // Header
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoBadge: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: COLORS.text, // Solid contrast block
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      // Modern shadow
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
    subtitle: {
      fontSize: 16,
      color: COLORS.muted,
    },

    // Toggle
    toggleWrapper: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.6)',
      borderRadius: 999,
      padding: 6,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.05)',
    },
    toggleBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 999,
    },
    toggleActive: {
      backgroundColor: COLORS.card,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    toggleText: {
      fontWeight: '600',
      color: COLORS.muted,
    },
    toggleTextActive: {
      color: COLORS.text,
      fontWeight: '700',
    },

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
      // Soft shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 8,
      elevation: 2,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: COLORS.text,
      fontWeight: '500',
    },
    forgotBtn: { alignSelf: 'flex-end', marginTop: 8, paddingRight: 4 },
    forgotText: { color: COLORS.muted, fontSize: 13, fontWeight: '600' },

    // Primary Button (Matches Landing CTA)
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
      // Deep shadow
      shadowColor: COLORS.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    primaryText: { color: COLORS.bg, fontSize: 18, fontWeight: '700' },
    btnIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent overlay
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Footer
    footerContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    footerText: { color: COLORS.muted, fontSize: 15 },
    signupText: { color: COLORS.primary, fontWeight: '800', fontSize: 15 },

    // Overlay
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderBox: {
      backgroundColor: 'transparent',
      paddingHorizontal: 26,
      paddingVertical: 18,
      borderRadius: 18,
    },

    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#ECFDF5',
      alignItems: 'center',
      justifyContent: 'center',
    },

    check: { color: '#22C55E', fontWeight: '800' },
  });
