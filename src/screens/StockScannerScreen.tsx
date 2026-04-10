import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type StockScannerScreenProps = NativeStackScreenProps<RootStackParamList, 'StockScanner'>;

export default function StockScannerScreen({ navigation, route }: StockScannerScreenProps) {
  const { mode = 'barcode', onScanSuccess } = route.params || {};

  const [hasPermission, setHasPermission] = useState(false);
  const [isScanned, setIsScanned] = useState(false);
  const device = useCameraDevice('back');

  // Animated scan line
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to scan.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    })();
  }, []);

  // Reset scan lock each time this screen comes into focus (user tapped SCAN again)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsScanned(false);
    });
    return unsubscribe;
  }, [navigation]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39', 'itf', 'upc-a', 'upc-e', 'data-matrix'],
    onCodeScanned: (codes) => {
      if (isScanned) return;
      const value = codes[0]?.value;
      if (!value) return;

      setIsScanned(true);

      // Call the callback if provided, then go back
      if (onScanSuccess) {
        onScanSuccess(value);
      }
      navigation.goBack();
    },
  });

  const title = mode === 'lokasi' ? 'Scan Lokasi' : 'Scan Barcode';

  if (!hasPermission || !device) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#f90" />
        <Text style={styles.loadingText}>Memuat kamera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isScanned}
          codeScanner={codeScanner}
        />

        {/* Overlay with scan frame */}
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanFrame}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {/* Animated scan line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, FRAME_HEIGHT - 2],
                      }),
                    }],
                  },
                ]}
              />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text style={styles.hintText}>
              {mode === 'lokasi'
                ? 'Arahkan kamera ke barcode lokasi'
                : 'Arahkan kamera ke barcode produk'}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const FRAME_WIDTH = 300;
const FRAME_HEIGHT = 180;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a2744',
  },
  backButton: { padding: 8, width: 40 },
  backIcon: { color: '#fff', fontSize: 20 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cameraContainer: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  overlayMiddle: { flexDirection: 'row', height: FRAME_HEIGHT },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanFrame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: '#f90',
    shadowColor: '#f90',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: 24,
  },
  hintText: { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#f90',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
});
