/**
 * Warehouse Stock Checker App
 * 
 * Features:
 * - Login authentication
 * - Barcode scanning for stock checking
 * - Manual stock entry
 * - Stock list view
 * - Offline support with async storage
 * 
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from './src/Navigation';
import sessionManager from './src/services/sessionManager';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    // Initialize session manager to handle app state changes
    sessionManager.initialize();

    return () => {
      sessionManager.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Navigation />
    </SafeAreaProvider>
  );
}

export default App;
