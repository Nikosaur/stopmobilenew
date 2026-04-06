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
import type { RootStackParamList, CekStokItem } from '../types';
import api from '../services/api';
import BottomNavigation from '../components/BottomNavigation';
import Clipboard from '@react-native-clipboard/clipboard';

type EditCekStokScreenProps = NativeStackScreenProps<RootStackParamList, 'EditCekStok'>;

export default function EditCekStokScreen({ navigation, route }: EditCekStokScreenProps) {
  const { cekStokId, teamRecheckStockId, isRecheckItem, checked, item } = route.params || {};

  const [lokasi, setLokasi] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [nama, setNama] = useState('');
  const [qtyBaik, setQtyBaik] = useState('0');
  const [qtyRusak, setQtyRusak] = useState('0');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setLokasi(item.lokasi);
      setBarcode(item.barcode || '');
      setSku(item.sku || item.kode || '');
      setNama(item.nama);
      setQtyBaik(item.qtyBaik.toString());
      setQtyRusak(item.qtyRusak.toString());
      setKeterangan(item.keterangan || '');
    }
  }, [item]);

  const validateAndSubmit = async () => {
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

    if (baikNum < 0 || rusakNum < 0) {
      Alert.alert('Error', 'Qty tidak boleh negatif');
      return;
    }

    setLoading(true);

    const input = {
      lokasi: lokasi.trim(),
      qtyBaik: baikNum,
      qtyRusak: rusakNum,
      keterangan: keterangan.trim() || undefined,
      barcode: barcode.trim() || undefined,
    };

    const result = isRecheckItem && teamRecheckStockId
      ? (checked
          ? await api.updateRecheckCekStok(teamRecheckStockId, input)
          : await api.createRecheckCekStok(teamRecheckStockId, input))
      : await api.updateCekStok(cekStokId!, input);

    if (result.success) {
      Alert.alert(
        'Sukses',
        'Data berhasil diperbarui',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Gagal menyimpan data');
      setLoading(false);
    }
  };

  const handleCopyBarcode = () => {
    if (!barcode.trim()) {
      return;
    }
    Clipboard.setString(barcode.trim());
    Alert.alert('Info', 'Barcode disalin');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Cek Stok</Text>
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
            <TouchableOpacity style={[styles.scanButton, styles.scanButtonDisabled]} disabled>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanTextDisabled}>SCAN</Text>
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
            <TouchableOpacity style={[styles.scanButton, styles.scanButtonDisabled]} disabled>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanTextDisabled}>SCAN</Text>
            </TouchableOpacity>
          </View>

          {/* SKU Display (Read Only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Kode Barang</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={sku}
              editable={false}
              placeholder="SKU"
              placeholderTextColor="#ccc"
            />
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('MasterBarang')}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>Lihat Master Barang</Text>
          </TouchableOpacity>

          {/* Nama Barang Display (Read Only) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Nama Barang</Text>
            <TextInput
              style={[styles.input, styles.readOnlyInput]}
              value={nama}
              editable={false}
              placeholder="Nama Barang"
              placeholderTextColor="#ccc"
            />
          </View>

          {/* Qty Row */}
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

          {/* Keterangan */}
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
              {loading ? '...' : 'SIMPAN'}
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
  fieldContainer: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 10,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    marginLeft: 4,
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
    borderLeftWidth: 1,
    borderLeftColor: '#ddd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  copyText: {
    fontSize: 12,
    color: '#b5b5b5',
    fontWeight: '600',
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
  linkText: {
    fontSize: 12,
    color: '#f90',
    textAlign: 'right',
    marginBottom: 14,
    marginTop: -8,
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
