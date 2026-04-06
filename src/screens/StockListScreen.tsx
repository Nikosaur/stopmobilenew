import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, CheckStock } from '../types';
import apiService from '../services/api';

type StockListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'StockList'>;

interface StockListScreenProps {
  navigation: StockListScreenNavigationProp;
}

export default function StockListScreen({ navigation }: StockListScreenProps) {
  const [stockItems, setStockItems] = useState<CheckStock[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStockItems = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await apiService.getCheckStocks();
      if (result.success && result.data) {
        setStockItems(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load stock items');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load stock items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStockItems(false);
  };

  const handleSearch = () => {
    // Search is now done via filtering the loaded check stocks
    loadStockItems();
  };

  const getStatusColor = (isRecheck: boolean) => {
    return isRecheck ? '#FF9500' : '#34C759';
  };

  const renderStockItem = ({ item }: { item: CheckStock }) => (
    <TouchableOpacity
      style={styles.stockCard}
      onPress={() => navigation.navigate('StockCheck', { barcode: item.barcode || item.sku_number })}
      activeOpacity={0.7}
    >
      <View style={styles.stockHeader}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.stockSku}>{item.sku_number}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.is_recheck_item) },
          ]}
        >
          <Text style={styles.statusText}>
            {item.is_recheck_item ? 'Recheck' : 'Checked'}
          </Text>
        </View>
      </View>

      <View style={styles.stockDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{item.location_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>
            Good: {item.qty_good} | Obsolete: {item.qty_obsolete}
          </Text>
        </View>
        {item.note && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Note:</Text>
            <Text style={styles.detailValue}>{item.note}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Stock List</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, SKU, or location"
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stockItems}
        renderItem={renderStockItem}
        keyExtractor={(item) => item.check_stock_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No stock items found'}
            </Text>
            {!loading && (
              <TouchableOpacity style={styles.refreshButton} onPress={() => loadStockItems()}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  searchButton: {
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  stockCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
    marginRight: 12,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  stockSku: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  stockDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 90,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
