import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import LandingPage from './app/screens/LandingPage';
import HomePage from './app/screens/HomePage';
import Product from './app/screens/Product';
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default App;
