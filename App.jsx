import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import LandingPage from './app/screens/LandingPage';
import HomePage from './app/screens/HomePage';
import Client from './app/screens/Client';
import Product from './app/screens/Product';
import Purchase from './app/screens/Purchase';
import Sales from './app/screens/Sales';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default App;
