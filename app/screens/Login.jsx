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
  Image,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import AlertBox from '../components/AlertBox';
import HapticFeedback from 'react-native-haptic-feedback';

export default function Auth({ navigation }) {
  const [mode, setMode] = useState('email'); // phone | email
  const [value, setValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [uiReady, setUiReady] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setUiReady(true);
    });
  }, []);

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

  const handleSubmit = async () => {
    try {
      if (mode === 'phone') {
        return Alert.alert(
          'Not Supported',
          'Phone login is not implemented yet',
        );
      }

      const res = await api.login({
        email: value.trim().toLowerCase(),
        password,
      });

      console.log('LOGIN RESPONSE 👉', res);

      if (!res?.token) {
        throw new Error('Token missing');
      }

      await AsyncStorage.setItem('token', res.token);
      await AsyncStorage.setItem('username', res.user.name);
      console.log('LOGIN TOKEN:', res.token);
      await AsyncStorage.setItem('token', res.token);

      await AsyncStorage.setItem('lastPasswordAuth', Date.now().toString());
      navigation.replace('HomePage');
    } catch (err) {
      shake();
      setModalData({
        title: 'Authentication Failed',
        message: err?.message || 'Invalid email or password',
        type: 'error',
      });
      setModalVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />

      <PulseCircle style={styles.bgCircleBlue} />
      <PulseCircle style={styles.bgCirclePurple} delay={800} />

      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <TouchableOpacity
              activeOpacity={0.8}
              delayLongPress={1000}
              onLongPress={() => {
                HapticFeedback.trigger('impactMedium', hapticOptions);
                navigation.navigate('Signup');
              }}
            >
              <Text style={styles.title}>Login Account</Text>
            </TouchableOpacity>

            <Text style={styles.subtitle}>Welcome back, let’s continue</Text>
          </View>
        </View>

        {/* TOGGLE */}
        <View style={styles.toggleWrapper}>
          {['email', 'phone'].map(type => (
            <TouchableOpacity
              key={type}
              activeOpacity={0.85}
              android_ripple={null}
              onPress={() => {
                setMode(type);
                setValue('');
                setPassword('');
              }}
              style={[
                styles.toggleBtn,
                uiReady && mode === type && styles.toggleActive,
              ]}
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

        {/* EMAIL / PHONE INPUT */}
        <Text style={styles.inputLabel}>
          {mode === 'phone' ? 'Phone Number' : 'Email Address'}
        </Text>

        <View style={styles.inputWrapper}>
          {mode === 'phone' && (
            <View style={styles.countryBox}>
              <Image
                source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                style={styles.countryFlag}
              />
              <Text style={styles.countryCode}>+91</Text>
            </View>
          )}

          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={mode === 'phone' ? '98765 43210' : 'you@example.com'}
            placeholderTextColor="#9CA3AF"
            keyboardType={mode === 'phone' ? 'phone-pad' : 'email-address'}
            style={styles.input}
          />

          {(mode === 'phone' ? isPhoneValid : isEmailValid) && (
            <View style={styles.checkCircle}>
              <Text style={styles.check}>✓</Text>
            </View>
          )}
        </View>

        {/* PASSWORD FIELD (EMAIL ONLY) */}
        {mode === 'email' && (
          <>
            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                style={styles.input}
              />

              <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.helperText}>
          {mode === 'phone'
            ? 'We’ll send you a verification code'
            : 'Use your account password to login'}
        </Text>

        {/* PRIMARY BUTTON */}
        <LinearGradient
          colors={['#4F46E5', '#4338CA']}
          style={[
            styles.primaryBtn,
            !(mode === 'phone' ? isPhoneValid : isEmailValid) && {
              opacity: 0.6,
            },
          ]}
        >
          <TouchableOpacity
            disabled={!(mode === 'phone' ? isPhoneValid : isEmailValid)}
            style={styles.primaryBtnInner}
            activeOpacity={0.9}
            onPress={handleSubmit}
          >
            <Text style={styles.primaryText}>
              {mode === 'phone' ? 'Send Code' : 'Login'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* FOOTER */}
        <Text style={styles.footer}>
          Need access?{' '}
          <Text
            style={styles.signup}
            onPress={() => {
              setModalData({
                title: 'Contact Envy',
                message: 'Please contact Envy support to create an account.',
                type: 'info',
              });
              setModalVisible(true);
            }}
          >
            Contact Envy
          </Text>
        </Text>

        <AlertBox
          visible={modalVisible}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
          onClose={() => setModalVisible(false)}
        />
      </Animated.View>
    </View>
  );
}

/* ================= PULSE CIRCLE ================= */
const PulseCircle = ({ style, delay = 0 }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.12,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 2600,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return <Animated.View style={[style, { transform: [{ scale }], opacity }]} />;
};

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  bgCircleBlue: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#CDEAFE',
    top: -80,
    right: -100,
  },
  bgCirclePurple: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#DDD6FE',
    bottom: -100,
    left: -80,
  },

  card: { padding: 22 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { marginTop: 6, fontSize: 14, color: '#6B7280' },

  flag: { width: 34, height: 34, borderRadius: 17 },

  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F9',
    borderRadius: 18,
    padding: 6,
    marginBottom: 22,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14 },
  toggleActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  toggleText: { textAlign: 'center', fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#4338CA' },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFB',
    paddingHorizontal: 14,
  },

  countryBox: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  countryFlag: { width: 22, height: 22, borderRadius: 11, marginRight: 4 },
  countryCode: { fontWeight: '600' },

  input: { flex: 1, fontSize: 16, color: '#111827' },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: { color: '#22C55E', fontWeight: '800' },

  eye: { fontSize: 18, paddingHorizontal: 4 },

  helperText: { marginTop: 8, fontSize: 12, color: '#6B7280' },

  primaryBtn: {
    height: 56,
    borderRadius: 20,
    marginTop: 22,
    marginBottom: 24,
  },
  primaryBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { textAlign: 'center', fontSize: 14, color: '#6B7280' },
  signup: { color: '#4338CA', fontWeight: '700' },
});
