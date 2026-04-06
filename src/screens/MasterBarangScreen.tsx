import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
  Clipboard,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, MasterBarang } from '../types';
import api from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

type MasterBarangScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MasterBarang'>;
};

export default function MasterBarangScreen({ navigation }: MasterBarangScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<MasterBarang[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadMasterBarang = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMasterBarang(searchQuery);
      console.log('MasterBarang loaded:', data.length, 'items');
      console.log('First item:', data[0]);
      setItems(data);
      const syncStatus = await api.getSyncStatus();
      setLastSync(syncStatus.lastSyncMaster);
    } catch (error) {
      console.error('Error loading master barang:', error);
      Alert.alert('Error', 'Gagal memuat data master barang');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadMasterBarang();
  }, [loadMasterBarang]);

  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await api.syncMasterBarang();
      if (result.success) {
        Alert.alert('Sukses', 'Data Master Barang berhasil disinkronisasi');
        loadMasterBarang();
      } else {
        Alert.alert('Error', result.error || 'Gagal sinkronisasi');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Gagal sinkronisasi');
      setLoading(false);
    }
  };

  const handleCopySKU = (sku: string) => {
    Clipboard.setString(sku);
    Alert.alert('Sukses', `SKU ${sku} telah disalin ke clipboard`);
  };

  const renderItem = ({ item }: { item: MasterBarang }) => {
    // Helper to safely get string value (handles both object {code, name} and string)
    const getStringValue = (val: any): string => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && val.name) return val.name;
      return '-';
    };

    return (
      <View style={styles.itemCard}>
        <View style={styles.row}>
          <Text style={styles.label}>No SKU</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{item?.sku || '-'}</Text>
            <TouchableOpacity onPress={() => handleCopySKU(item?.sku || '')} style={styles.copyButton}>
              <Text style={styles.copyIcon}>📋</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama</Text>
          <Text style={styles.value}>{item?.nama || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Barcode</Text>
          <Text style={styles.value}>{item?.barcode || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kategori</Text>
          <Text style={styles.valueEmpty}>({getStringValue(item?.category)})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Brand</Text>
          <Text style={styles.valueEmpty}>({getStringValue(item?.brand)})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Group</Text>
          <Text style={styles.valueEmpty}>({getStringValue(item?.group)})</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Master Barang</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari Kode / Nama / Barcode"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={items.filter(item => item && (item.id || item.sku))}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id || item?.sku || `item-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadMasterBarang} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Memuat data...' : `Tidak ada data master barang (loaded: ${items.length})`}
            </Text>
          </View>
        }
      />

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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  valueEmpty: {
    fontSize: 16,
    color: '#999',
    flex: 2,
    textAlign: 'right',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
  },
  copyIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});
