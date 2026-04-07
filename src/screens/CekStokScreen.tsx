import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, CekStokItem } from '../types';
import api from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

type CekStokScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CekStok'>;
};

type SortField = 'kode' | 'nama' | 'lokasi' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function CekStokScreen({ navigation }: CekStokScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [items, setItems] = useState<CekStokItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [tahap, setTahap] = useState('CL');
  const [pendingSync, setPendingSync] = useState(0);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [checkedCount, setCheckedCount] = useState(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCekStok = useCallback(async () => {
    setLoading(true);
    const data = await api.getCekStokItems(debouncedSearchQuery);
    setItems(data);
    setTotal(data.length);
    const checked = data.filter(item => item.checked).length;
    setCheckedCount(checked);
    const currentTahap = await api.getTahapOpname();
    setTahap(currentTahap);
    const syncStatus = await api.getSyncStatus();
    setPendingSync(syncStatus.pendingUploads);
    setLoading(false);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    loadCekStok();
  }, [loadCekStok]);

  const handleSync = async () => {
    if (items.length === 0) {
      Alert.alert('Info', 'Tidak ada data untuk dikirim');
      return;
    }

    setLoading(true);
    const result = await api.syncCekStokToServer();
    if (result.success) {
      Alert.alert('Sukses', result.message || 'Data berhasil dikirim ke server');
      loadCekStok();
    } else {
      Alert.alert('Error', result.error || 'Gagal mengirim data');
      setLoading(false);
    }
  };

  const handleDelete = (id: string, nama: string) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Hapus ${nama}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const result = await api.deleteCekStok(id);
            if (result.success) {
              loadCekStok();
            } else {
              Alert.alert('Error', 'Gagal menghapus data');
            }
          },
        },
      ]
    );
  };

  const handleFocusSKU = (sku: string) => {
    setSearchQuery(sku);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedItems = () => {
    return [...items].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cek Stok</Text>
        <View style={styles.backButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode / nama"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Tahap, Total, and Progress */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>Tahap : {tahap}</Text>
        <Text style={styles.statsText}>Total : {total}</Text>
        <Text style={styles.statsText}>
          Progress : {total > 0 ? (() => {
            const pct = (checkedCount / total) * 100;
            return Number.isInteger(pct) ? pct.toString() : pct.toFixed(2);
          })() : '0'}%
        </Text>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.colLokasi]}>Lokasi</Text>
        <Text style={[styles.tableHeaderText, styles.colSKU]}>SKU</Text>
        <Text style={[styles.tableHeaderText, styles.colNama]}>Nama</Text>
        <Text style={[styles.tableHeaderText, styles.colQty]}>Qty{'\n'}Baik</Text>
        <Text style={[styles.tableHeaderText, styles.colQty]}>Qty{'\n'}Rusak</Text>
      </View>

      {/* Table Body */}
      <FlatList
        data={getSortedItems().filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tableRow}
            onPress={() =>
              navigation.navigate('EditCekStok', {
                cekStokId: item.id,
                teamRecheckStockId: item.teamRecheckStockId,
                isRecheckItem: item.isRecheckItem,
                checked: item.checked,
                item,
              })
            }
          >
            <Text style={[styles.tableCell, styles.colLokasi]}>{item.lokasi}</Text>
            <TouchableOpacity
              style={styles.colSKU}
              onPress={() => setSearchQuery(item.sku)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tableCell, styles.skuLink]}>{item.sku}</Text>
            </TouchableOpacity>
            <View style={[styles.colNama]}>
              <Text style={styles.namaText}>{item.nama}</Text>
            </View>
            <Text style={[styles.tableCell, styles.colQty]}>{item.qtyBaik}</Text>
            <Text style={[styles.tableCell, styles.colQty]}>{item.qtyRusak}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => item?.id ? `${item.id}-${index}` : `item-${index}`}
        contentContainerStyle={styles.listContent}
        // Performance optimizations
        windowSize={10}
        maxToRenderPerBatch={20}
        initialNumToRender={20}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({ length: 44, offset: 44 * index, index })}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadCekStok} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Memuat data...' : 'Belum ada data cek stok'}
            </Text>
          </View>
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('InputCekStok', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 12,
    color: '#333',
  },
  namaText: {
    fontSize: 11,
    color: '#666',
  },
  colLokasi: {
    width: 50,
  },
  colSKU: {
    width: 100,
  },
  skuLink: {
    color: '#1a2744',
    fontWeight: '700',
  },
  colNama: {
    flex: 1.5,
  },
  colQty: {
    width: 50,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f90',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});
