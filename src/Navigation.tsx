import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import MasterBarangScreen from './screens/MasterBarangScreen';
import CekStokScreen from './screens/CekStokScreen';
import InputCekStokScreen from './screens/InputCekStokScreen';
import EditCekStokScreen from './screens/EditCekStokScreen';
import StockScannerScreen from './screens/StockScannerScreen';
import AkunScreen from './screens/AkunScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MasterBarang" component={MasterBarangScreen} />
        <Stack.Screen name="CekStok" component={CekStokScreen} />
        <Stack.Screen name="InputCekStok" component={InputCekStokScreen} />
        <Stack.Screen name="EditCekStok" component={EditCekStokScreen} />
        <Stack.Screen name="StockScanner" component={StockScannerScreen} />
        <Stack.Screen name="Akun" component={AkunScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
