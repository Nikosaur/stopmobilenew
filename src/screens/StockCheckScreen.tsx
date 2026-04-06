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
import type { RootStackParamList, Product, CheckStockInput } from '../types';
import apiService from '../services/api';

type StockCheckScreenProps = NativeStackScreenProps<RootStackParamList, 'StockCheck'>;

export default function StockCheckScreen({ route, navigation }: StockCheckScreenProps) {
  const { barcode: initialBarcode } = route.params || {};
  
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [product, setProduct] = useState<Product | null>(null);
  const [skuNumber, setSkuNumber] = useState('');
  const [location, setLocation] = useState('');
  const [qtyGood, setQtyGood] = useState('');
  const [qtyObsolete, setQtyObsolete] = useState('');
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
      Alert.alert('Error', 'Please enter a barcode or SKU');
      return;
    }

    setSearching(true);
    setLoading(true);
    try {
      const result = await apiService.getProductByBarcode(code);
      if (result.success && result.data) {
        setProduct(result.data);
        setSkuNumber(result.data.sku_number);
      } else {
        setProduct(null);
        setSkuNumber(code);
        Alert.alert(
          'Not Found',
          'No product found with this barcode. You can still record a check with the SKU.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search product');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleSearch = () => {
    searchStock(barcode);
  };

  const handleSave = async () => {
    if (!skuNumber.trim()) {
      Alert.alert('Error', 'Please enter SKU number');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter location');
      return;
    }

    const goodQty = parseInt(qtyGood, 10) || 0;
    const obsoleteQty = parseInt(qtyObsolete, 10) || 0;

    if (goodQty < 0 || obsoleteQty < 0) {
      Alert.alert('Error', 'Please enter valid quantities');
      return;
    }

    setSaving(true);
    try {
      const result = await apiService.createCheckStock({
        sku_number: skuNumber.toUpperCase(),
        location: location.toUpperCase(),
        qty_good: goodQty,
        qty_obsolete: obsoleteQty,
        barcode: barcode || undefined,
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
                setProduct(null);
                setSkuNumber('');
                setLocation('');
                setQtyGood('');
                setQtyObsolete('');
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

          {/* Product Info Section */}
          {product && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Product Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{product.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>SKU:</Text>
                <Text style={styles.infoValue}>{product.sku_number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category:</Text>
                <Text style={styles.infoValue}>{product.category.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Brand:</Text>
                <Text style={styles.infoValue}>{product.brand.name}</Text>
              </View>
            </View>
          )}

          {/* Check Form Section */}
          <View style={styles.section}>
            <Text style={styles.label}>SKU Number *</Text>
            <TextInput
              style={styles.input}
              value={skuNumber}
              onChangeText={setSkuNumber}
              placeholder="Enter SKU number"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
              placeholderTextColor="#999"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Quantity Good *</Text>
            <TextInput
              style={styles.input}
              value={qtyGood}
              onChangeText={setQtyGood}
              placeholder="Enter good quantity"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Quantity Obsolete *</Text>
            <TextInput
              style={styles.input}
              value={qtyObsolete}
              onChangeText={setQtyObsolete}
              placeholder="Enter obsolete quantity"
              placeholderTextColor="#999"
              keyboardType="numeric"
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
