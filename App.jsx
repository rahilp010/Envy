import React, { useEffect, useState } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/app/store';
import AppNavigator from './src/navigation/AppNavigator';
import { setupDatabase } from './src/database';
import Loader from './src/components/common/Loader';
import Toast, { toastConfig } from './src/components/common/Toast';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function MainApp() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await setupDatabase();
      } catch (err) {
        console.error('Database setup failed on startup:', err);
      } finally {
        setTimeout(() => {
          setDbReady(true);
        }, 1000);
      }
    };
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" />
        <Loader fullScreen message="Initializing ENVY ERP Database..." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <AppNavigator />
      <Toast config={toastConfig} />
    </View>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <MainApp />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#16161b',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#121217',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
