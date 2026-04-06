import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MasterBarang } from '../types';
import Clipboard from '@react-native-clipboard/clipboard';
import api from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

type InputCekStokScreenProps = NativeStackScreenProps<RootStackParamList, 'InputCekStok'>;

export default function InputCekStokScreen({ navigation, route }: InputCekStokScreenProps) {
  const { barcode: initialBarcode, lokasi: scannedLokasi } = route.params || {};

  const [lokasi, setLokasi] = useState('');
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [masterBarang, setMasterBarang] = useState<MasterBarang | null>(null);
  const [qtyBaik, setQtyBaik] = useState('0');
  const [qtyRusak, setQtyRusak] = useState('0');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [masterBarangList, setMasterBarangList] = useState<MasterBarang[]>([]);

  useEffect(() => {
    loadMasterBarangList();
  }, []);

  useEffect(() => {
    if (initialBarcode) {
      setBarcode(initialBarcode);
      searchByBarcode(initialBarcode);
    }
  }, [initialBarcode]);

  useEffect(() => {
    if (scannedLokasi) {
      setLokasi(scannedLokasi);
    }
  }, [scannedLokasi]);

  const loadMasterBarangList = async () => {
    const data = await api.getMasterBarang();
    setMasterBarangList(data);
  };

  const searchByBarcode = async (barcode: string) => {
    const result = await api.getMasterBarangByBarcode(barcode);
    if (result) {
      setMasterBarang(result);
    } else {
      Alert.alert('Error', 'Barcode tidak ditemukan di Master Barang');
    }
  };

  const handleSelectMasterBarang = (item: MasterBarang) => {
    setMasterBarang(item);
    setShowDropdown(false);
  };

  const handleScanLokasi = () => {
    navigation.navigate('StockScanner', {
      mode: 'lokasi',
      returnTo: 'InputCekStok',
      returnKey: 'lokasi',
    });
  };

  const handleScanBarcode = () => {
    navigation.navigate('StockScanner', {
      mode: 'barcode',
      returnTo: 'InputCekStok',
      returnKey: 'barcode',
    });
  };

  const handleCopyBarcode = () => {
    if (!barcode.trim()) {
      return;
    }
    Clipboard.setString(barcode.trim());
    Alert.alert('Info', 'Barcode disalin');
  };

  const validateAndSubmit = async () => {
    if (!masterBarang) {
      Alert.alert('Error', 'Pilih barang dari dropdown terlebih dahulu');
      return;
    }
    if (!lokasi.trim()) {
      Alert.alert('Error', 'Input Lokasi wajib diisi');
      return;
    }
    if (qtyBaik === '' && qtyRusak === '') {
      Alert.alert('Error', 'Isi minimal salah satu Qty (Baik atau Rusak)');
      return;
    }

    const baikNum = parseInt(qtyBaik || '0', 10);
    const rusakNum = parseInt(qtyRusak || '0', 10);

    if (Number.isNaN(baikNum) || Number.isNaN(rusakNum)) {
      Alert.alert('Error', 'Qty harus angka');
      return;
    }

    if (baikNum < 0 || rusakNum < 0) {
      Alert.alert('Error', 'Qty tidak boleh negatif');
      return;
    }

    setLoading(true);

    const input = {
      sku: masterBarang.sku,
      lokasi: lokasi.trim(),
      qtyBaik: baikNum,
      qtyRusak: rusakNum,
      keterangan: keterangan.trim() || undefined,
      barcode: barcode.trim() || undefined,
    };

    const result = await api.saveCekStok(input);

    if (result.success) {
      Alert.alert(
        'Sukses',
        'Data berhasil disimpan',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Gagal menyimpan data');
      setLoading(false);
    }
  };

  const filteredMasterBarang = masterBarangList;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Input Cek Stok</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          <View style={styles.fieldRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lokasi</Text>
              <TextInput
                style={styles.input}
                placeholder="Lokasi"
                value={lokasi}
                onChangeText={setLokasi}
                autoCapitalize="characters"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanLokasi}>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanText}>SCAN</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Barcode</Text>
              <View style={styles.barcodeContainer}>
                <TextInput
                  style={[styles.input, styles.barcodeInput]}
                  placeholder="Barcode"
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyBarcode}>
                  <Text style={styles.copyText}>COPY</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanBarcode}>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanText}>SCAN</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>SKU / Kode Part</Text>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setShowDropdown(!showDropdown)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownText, masterBarang && styles.dropdownValue]}>
                {masterBarang?.sku || 'Pilih SKU / Kode Part'}
              </Text>
              <Text style={[styles.dropdownArrow, showDropdown && styles.dropdownArrowUp]}>⌃</Text>
            </TouchableOpacity>
            {showDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {filteredMasterBarang.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => handleSelectMasterBarang(item)}
                    >
                      <Text style={styles.dropdownItemSku}>{item.sku}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('MasterBarang')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Lihat Master Barang</Text>
          </TouchableOpacity>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nama Barang</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={masterBarang?.nama || ''}
              editable={false}
              placeholder="Nama Barang"
              placeholderTextColor="#ccc"
            />
          </View>

          <View style={styles.qtyRow}>
            <View style={styles.qtyContainer}>
              <Text style={styles.qtyLabel}>Qty Baik</Text>
              <TextInput
                style={styles.qtyInput}
                value={qtyBaik}
                onChangeText={setQtyBaik}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.qtyContainer}>
              <Text style={styles.qtyLabel}>Qty Rusak</Text>
              <TextInput
                style={styles.qtyInput}
                value={qtyRusak}
                onChangeText={setQtyRusak}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={[styles.input, styles.keteranganInput]}
              placeholder="Keterangan"
              value={keterangan}
              onChangeText={setKeterangan}
              multiline
              placeholderTextColor="#999"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={validateAndSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? '...' : 'KIRIM'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeScreen="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a2744',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  backIcon: {
    color: '#fff',
    fontSize: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    marginRight: 12,
  },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  barcodeInput: {
    flex: 1,
    borderWidth: 0,
  },
  copyButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
  },
  copyText: {
    fontSize: 12,
    color: '#b5b5b5',
    fontWeight: '600',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  readOnlyInput: {
    backgroundColor: '#f9f9f9',
    color: '#f90',
  },
  notFoundInput: {
    color: '#f44336',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f90',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 4,
    minWidth: 98,
  },
  scanButtonDisabled: {
    backgroundColor: '#ebebeb',
  },
  scanIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  scanTextDisabled: {
    color: '#9e9e9e',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scanText: {
    color: '#1a2744',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#999',
  },
  dropdownValue: {
    color: '#333',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#999',
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#ddd',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#fff',
    maxHeight: 220,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSku: {
    fontSize: 14,
    color: '#333',
  },
  linkText: {
    fontSize: 12,
    color: '#f90',
    textAlign: 'right',
    marginBottom: 14,
    marginTop: -8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  qtyRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  qtyContainer: {
    flex: 1,
  },
  qtyLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    marginLeft: 4,
  },
  qtyInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'left',
  },
  keteranganInput: {
    height: 44,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#f90',
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#1a2744',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
