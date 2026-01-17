import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import LandingPage from './app/screens/LandingPage';
import HomePage from './app/screens/HomePage';
import Client from './app/screens/Client';
import Product from './app/screens/Product';
import Purchase from './app/screens/Purchase';
import Sales from './app/screens/Sales';
import NotFoundScreen from './app/utility/NotFoundScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';
import BankSystem from './app/screens/BankSystem';
import Account from './app/components/Bank/Account';
import Ledger from './app/components/Bank/Ledger';
import Transfer from './app/components/Bank/Transfer';
import LedgerClientList from './app/components/Bank/LedgerClientList';
import Analytics from './app/screens/Analytics';
import Report from './app/screens/Report';
import Settings from './app/screens/Settings';
import About from './app/components/Settings/About';
import { ThemeProvider } from './app/theme/ThemeContext';

// const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function App() {
  return (
    <ThemeProvider>
      <NavigationContainer
        onReady={async () => {
          await BootSplash.hide({ fade: true });
        }}
      >
        <StatusBar barStyle="light-content" />
        <Stack.Navigator initialRouteName="Dashboard">
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Dashboard"
            component={LandingPage}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="HomePage"
            component={HomePage}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Product"
            component={Product}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Client"
            component={Client}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Purchase"
            component={Purchase}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Sales"
            component={Sales}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="BankSystem"
            component={BankSystem}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Account"
            component={Account}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Ledger"
            component={Ledger}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Transfer"
            component={Transfer}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="LedgerClientList"
            component={LedgerClientList}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Analytics"
            component={Analytics}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Report"
            component={Report}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="Settings"
            component={Settings}
          />
          <Stack.Screen
            options={{
              headerShown: false,
              tabBarVisible: false,
              tabBarStyle: { display: 'none' },
            }}
            name="About"
            component={About}
          />
          <Stack.Screen
            name="NotFound"
            component={NotFoundScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
export default App;
