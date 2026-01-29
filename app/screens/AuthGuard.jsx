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
    const biometricEnabled =
      (await AsyncStorage.getItem('biometricEnabled')) === 'true';

    if (!biometricEnabled) {
      allowEntry();
      return;
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
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  useEffect(() => {
    runAuthCheck();
  }, []);

  return null;
}
