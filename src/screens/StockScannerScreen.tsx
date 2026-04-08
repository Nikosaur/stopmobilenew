import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType, CameraApi } from 'react-native-camera-kit';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import apiService from '../services/api';

type StockScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'StockScanner'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_BOX_WIDTH = 250;
const SCAN_BOX_HEIGHT = 150;

export default function StockScannerScreen({ navigation, route }: StockScannerScreenProps) {
  const { mode, returnTo, returnKey } = route.params || {};
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraApi>(null);

  // Animated scanning line
  const scanLinePosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    let animationRef: Animated.CompositeAnimation | null = null;

    // Start the scanning line animation
    const startAnimation = () => {
      if (!isMounted) return;
      animationRef = Animated.loop(
        Animated.sequence([
          // Move down
          Animated.timing(scanLinePosition, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          // Move up
          Animated.timing(scanLinePosition, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );
      animationRef.start();
    };

    startAnimation();

    return () => {
      isMounted = false;
      if (animationRef) {
        animationRef.stop();
        animationRef = null;
      }
    };
  }, []);

  // Interpolate position for the scanning line
  const scanLineTranslate = scanLinePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_BOX_HEIGHT - 2],
  });

  const handleBarcodeRead = (event: { nativeEvent: { codeStringValue: string } }) => {
    if (!scanned) {
      const value = event.nativeEvent.codeStringValue;
      setScanned(true);
      handleBarcodeScanned(value);
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      if (granted) {
        setHasPermission(true);
        setPermissionDenied(false);
      } else {
        setHasPermission(false);
      }
    } catch (err) {
      console.warn(err);
      setHasPermission(false);
    }
  };

  const requestPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to scan barcodes',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setHasPermission(true);
        setPermissionDenied(false);
      } else {
        setHasPermission(false);
        setPermissionDenied(true);
      }
    } catch (err) {
      console.warn(err);
      setHasPermission(false);
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      Alert.alert('Error', 'Unable to open settings');
    }
  };

  const handleBarcodeScanned = async (value: string) => {
    // Return scan to caller (InputCekStok) without API checks
    if (returnTo && returnKey) {
      navigation.navigate({
        name: returnTo,
        params: { [returnKey]: value },
        merge: true,
      } as any);
      navigation.goBack();
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.getProductByBarcode(value);
      if (result.success && result.data) {
        navigation.navigate('StockCheck', { barcode: value });
      } else {
        Alert.alert(
          'Item Not Found',
          `No stock found for barcode: ${value}`,
          [
            {
              text: 'Try Again',
              onPress: () => setScanned(false),
            },
            {
              text: 'Manual Entry',
              onPress: () => navigation.navigate('StockCheck', { barcode: value }),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check stock');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = () => {
    if (returnTo) {
      navigation.goBack();
      return;
    }
    navigation.navigate('StockCheck', {});
  };

  if (hasPermission === null) {
    // Still checking permission
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#f90" />
          <Text style={styles.permissionText}>Checking camera access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.bigEmoji}>📷</Text>
          <Text style={styles.permissionText}>
            {permissionDenied
              ? 'Camera access denied. Please enable it in settings.'
              : 'Camera permission required to scan barcodes'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={permissionDenied ? openSettings : requestPermission}
          >
            <Text style={styles.buttonText}>
              {permissionDenied ? 'Open Settings' : 'Grant Permission'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
            <Text style={styles.manualButtonText}>Manual Entry Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'lokasi' ? 'Scan Lokasi' : 'Scan Barcode'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          cameraType={CameraType.Back}
          scanBarcode={true}
          showFrame={false}
          laserColor="#f90"
          frameColor="#f90"
          onReadCode={handleBarcodeRead}
          focusMode="on"
          zoomMode="off"
        />
        
        {/* Scanner Overlay - just the scan box with animated line */}
        <View style={styles.overlay}>
          {/* Scan Box with corners and animated line */}
          <View style={styles.scanBox}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            
            {/* Animated scanning line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
            
            {/* Laser effect on the line */}
            <Animated.View
              style={[
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            />
          </View>
          
          {/* Scan instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionText}>
              {mode === 'lokasi' ? 'Scan barcode lokasi' : 'Arahkan barcode ke dalam kotak'}
            </Text>
          </View>
        </View>
        
        {/* Scanning overlay */}
        {scanned && !loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f90" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Mencari data...</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hint}>
          {mode === 'lokasi' ? 'Posisikan QR/Code lokasi di frame' : 'Position barcode within the frame'}
        </Text>
        <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
          <Text style={styles.keyboardEmoji}>⌨️</Text>
          <Text style={styles.manualButtonText}>
            {returnTo ? 'Kembali' : 'Enter Manually'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#1a1a1a',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  scanBox: {
    width: SCAN_BOX_WIDTH,
    height: SCAN_BOX_HEIGHT,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: 'rgb(255, 255, 255)',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgb(255, 255, 255)',
    elevation: 4,
  },
  instructions: {
    position: 'absolute',
    top: '65%',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  keyboardEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  manualButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  bigEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
