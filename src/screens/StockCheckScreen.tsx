import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, StockItem } from '../types';
import apiService from '../services/api';

type StockCheckScreenProps = NativeStackScreenProps<RootStackParamList, 'StockCheck'>;

export default function StockCheckScreen({ route, navigation }: StockCheckScreenProps) {
  const { barcode: initialBarcode } = route.params || {};
  
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [actualQuantity, setActualQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'matched' | 'mismatch' | 'damaged' | 'missing'>('matched');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initialBarcode) {
      searchStock(initialBarcode);
    }
  }, [initialBarcode]);

  const searchStock = async (code: string) => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a barcode');
      return;
    }

    setSearching(true);
    setLoading(true);
    try {
      const result = await apiService.getStockByBarcode(code);
      if (result.success && result.data) {
        setStockItem(result.data);
        setActualQuantity(result.data.quantity.toString());
      } else {
        setStockItem(null);
        Alert.alert(
          'Not Found',
          'No stock item found with this barcode. You can still record a check.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search stock');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = () => {
    searchStock(barcode);
  };

  const handleSave = async () => {
    if (!actualQuantity.trim()) {
      Alert.alert('Error', 'Please enter actual quantity');
      return;
    }

    const quantity = parseInt(actualQuantity, 10);
    if (isNaN(quantity) || quantity < 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setSaving(true);
    try {
      const result = await apiService.updateStockCheck({
        stockId: stockItem?.id || barcode,
        actualQuantity: quantity,
        notes: notes || undefined,
        status,
      });

      if (result.success) {
        Alert.alert(
          'Success',
          'Stock check recorded successfully',
          [
            {
              text: 'Check Another',
              onPress: () => {
                setBarcode('');
                setStockItem(null);
                setActualQuantity('');
                setNotes('');
                setStatus('matched');
              },
            },
            {
              text: 'Go Home',
              onPress: () => navigation.navigate('Home'),
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save stock check');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save stock check');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Stock Check</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollContent}>
          {/* Barcode Search Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Barcode</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.barcodeInput}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Enter or scan barcode"
                placeholderTextColor="#999"
                autoFocus={!initialBarcode}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.searchButton, searching && styles.buttonDisabled]}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Stock Info Section */}
          {stockItem && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Stock Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{stockItem.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SKU:</Text>
                <Text style={styles.infoValue}>{stockItem.sku}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{stockItem.zone} - {stockItem.shelf}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expected Qty:</Text>
                <Text style={styles.infoValue}>{stockItem.quantity} {stockItem.unit}</Text>
              </View>
            </View>
          )}

          {/* Check Form Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Actual Quantity *</Text>
            <TextInput
              style={styles.input}
              value={actualQuantity}
              onChangeText={setActualQuantity}
              placeholder="Enter actual quantity found"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {(['matched', 'mismatch', 'damaged', 'missing'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusButton,
                    status === s && styles.statusButtonActive,
                  ]}
                  onPress={() => setStatus(s)}
                >
                  <Text
                    style={[
                      styles.statusText,
                      status === s && styles.statusTextActive,
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this check"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Stock Check</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
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
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 50,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    height: 48,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  statusTextActive: {
    color: '#fff',
  },
  saveButton: {
    height: 48,
    backgroundColor: '#34C759',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
