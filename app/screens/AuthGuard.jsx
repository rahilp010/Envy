import { useEffect } from 'react';
import { AppState, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateWithBiometrics } from '../utility/biometricAuth';
import { isPasswordRequired } from '../utility/authPolicy';

export default function AuthGuard({ navigation }) {
  useEffect(() => {
    let bgTime = Date.now();

    const sub = AppState.addEventListener('change', async state => {
      if (state === 'background') bgTime = Date.now();

      if (state === 'active' && Date.now() - bgTime > 10_000) {
        await runAuthCheck();
      }
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => back.remove();
  }, []);

  const runAuthCheck = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!token) {
      return forceLogout();
    }
    const biometricEnabled =
      (await AsyncStorage.getItem('biometricEnabled')) === 'true';

    if (!biometricEnabled) {
      return allowEntry();
    }

    const { success, cancelled } = await authenticateWithBiometrics();

    if (cancelled) {
      BackHandler.exitApp();
      return;
    }

    if (!success) {
      await forceLogout();
      return;
    }

    const needsPassword = await isPasswordRequired();
    if (needsPassword) {
      await forceLogout();
      return;
    }

    allowEntry();
  };

  const allowEntry = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'HomePage' }],
    });
  };

  const forceLogout = async () => {
    await AsyncStorage.multiRemove([
      'token',
      'lastPasswordAuth',
      'biometricEnabled',
      'username',
    ]);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  useEffect(() => {
    runAuthCheck();
  }, []);

  return null;
}
