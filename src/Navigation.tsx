import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import StockScannerScreen from './screens/StockScannerScreen';
import StockCheckScreen from './screens/StockCheckScreen';
import StockListScreen from './screens/StockListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="StockScanner" component={StockScannerScreen} />
        <Stack.Screen name="StockCheck" component={StockCheckScreen} />
        <Stack.Screen name="StockList" component={StockListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
