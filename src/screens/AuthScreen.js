import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { setAuth, setCurrentUser } from '../app/features/envySlice';
import { showSuccessToast, showErrorToast } from '../components/common/Toast';
import { getOrCreateSystemAccount } from '../database/handlers/accountHandlers';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function AuthScreen({ navigation }) {
  const dispatch = useDispatch();
  const [passcode, setPasscode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputsRef = useRef([]);

  const handleDigitChange = (val, index) => {
    if (!/^\d*$/.test(val)) return;

    const newCode = [...passcode];
    newCode[index] = val;
    setPasscode(newCode);

    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (val && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !passcode[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeToVerify) => {
    const code = codeToVerify || passcode.join('');
    if (code.length !== 6) {
      showErrorToast('Incomplete Code', 'Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    try {
      const validCode = '123123';
      if (code === validCode) {
        await getOrCreateSystemAccount('bank');
        await getOrCreateSystemAccount('cash');

        dispatch(setAuth(true));
        dispatch(setCurrentUser({ name: 'Admin', role: 'admin' }));
        showSuccessToast('Authenticated', 'Welcome back to ENVY ERP');

        setTimeout(() => {
          navigation.replace('MainDrawer');
        }, 300);
      } else {
        showErrorToast('Access Denied', 'Incorrect passcode (Default: 123123)');
        setPasscode(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      }
    } catch (e) {
      showErrorToast('Error', e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121217" />
      <View style={styles.content}>
        {/* Logo and Header */}
        <View style={styles.logoSection}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="shield-lock-outline" size={44} color="#daf4aa" />
          </View>
          <Text style={styles.appName}>ENVY ERP</Text>
          <Text style={styles.tagline}>Industrial & Commercial Management</Text>
        </View>

        {/* Passcode Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enter Passcode</Text>
          <Text style={styles.cardSubtitle}>
            Please enter your 6-digit security code to proceed
          </Text>

          {/* 6 Digit Input Boxes */}
          <View style={styles.digitRow}>
            {passcode.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                style={[
                  styles.digitBox,
                  digit ? styles.digitBoxFilled : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit ? '•' : ''}
                onChangeText={(val) => handleDigitChange(val, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                secureTextEntry={false}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, isVerifying ? styles.buttonDisabled : null]}
            onPress={() => verifyCode()}
            disabled={isVerifying}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="lock-open-outline"
              size={20}
              color="#16161b"
              style={styles.verifyIcon}
            />
            <Text style={styles.verifyText}>
              {isVerifying ? 'Verifying...' : 'Authenticate'}
            </Text>
          </TouchableOpacity>

          <View style={styles.hintContainer}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#64748b" />
            <Text style={styles.hintText}>Default System PIN: 123123</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121217',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(218, 244, 170, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(218, 244, 170, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1c1c24',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  digitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
  },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#14141a',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    color: '#daf4aa',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  digitBoxFilled: {
    borderColor: '#daf4aa',
    backgroundColor: 'rgba(218, 244, 170, 0.08)',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#daf4aa',
    width: '100%',
    height: 50,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyIcon: {
    marginRight: 8,
  },
  verifyText: {
    color: '#16161b',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  hintText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
});
