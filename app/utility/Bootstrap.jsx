import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Bootstrap({ navigation }) {
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('token');

      navigation.reset({
        index: 0,
        routes: [{ name: token ? 'AuthGuard' : 'Login' }],
      });
    };

    init();
  }, []);

  return null;
}
