import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse, AuthResponse, User, Product, CheckStock, CheckStockInput, Team, StockOpname, SyncStatus, CekStokItem, MasterBarang } from '../types';

// TODO: Replace with your actual Laravel API URL
const API_BASE_URL = 'https://parts.dev.biz.id/stop/api';
// // Local Laravel API URL for Android emulator (10.0.2.2 maps to host's 127.0.0.1)
// const API_BASE_URL = 'http://10.0.2.2:8000';

const TOKEN_KEY = '@auth_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USER_KEY = '@auth_user';

class ApiService {
  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY);
  }

  private async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  private async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  }

  private async setRefreshToken(token: string): Promise<void> {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  }

  private async getUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async clearAuth(): Promise<void> {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  }

  private isRefreshing = false;

  private async refreshAccessToken(): Promise<boolean> {
    if (this.isRefreshing) return false;
    this.isRefreshing = true;
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/token/v1/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getToken()}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const tokenData = data?.data?.token || data?.token || data;

      if (tokenData?.access_token) {
        await this.setToken(tokenData.access_token);
        if (tokenData.refresh_token) {
          await this.setRefreshToken(tokenData.refresh_token);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async request<T>(endpoint: string, options?: RequestInit, requireAuth = true): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> || {}),
      };

      if (requireAuth) {
        const token = await this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response: Response | null = null;
      try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // Check if it's an abort error (timeout)
        if (fetchError?.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout: Server took too long to respond',
          };
        }
        // Network error - fetch threw
        console.error('Fetch error:', fetchError);
        return {
          success: false,
          error: 'Network error: Unable to connect to server. Please check your connection.',
        };
      }

      // Defensive check - if response is null or has invalid status
      if (!response || typeof response.status !== 'number' || response.status === 0) {
        console.error('Invalid response:', response);
        return {
          success: false,
          error: 'Network error: Invalid server response',
        };
      }

      // Only process valid HTTP status codes
      if (response.status < 100 || response.status >= 600) {
        console.error('Invalid HTTP status:', response.status);
        return {
          success: false,
          error: 'Network error: Invalid HTTP status from server',
        };
      }

      // Try to parse JSON, but handle cases where response isn't JSON
      let data: any;
      try {
        const text = await response.text();
        // Try to parse as JSON, fallback to text
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { message: text || response.statusText };
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError);
        data = { message: response.statusText || 'Unknown error' };
      }

      if (!response.ok) {
        // If 401 and this is an authenticated request, try refreshing the token
        if (response.status === 401 && requireAuth) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry the request once with the new token
            return this.requestWithoutRetry<T>(endpoint, options, requireAuth);
          }
        }
        return {
          success: false,
          error: data.message || data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      console.error('Request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Duplicate of request() but without retry — used after a token refresh to avoid infinite loops
  private async requestWithoutRetry<T>(endpoint: string, options?: RequestInit, requireAuth = true): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> || {}),
      };
      if (requireAuth) {
        const token = await this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      const text = await response.text();
      let data: any;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!response.ok) {
        return { success: false, error: data.message || data.error || `HTTP error! status: ${response.status}` };
      }
      return { success: true, data: data.data || data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Auth
  async login(username: string, password: string): Promise<ApiResponse<User>> {
    const result = await this.request<AuthResponse>('/auth/v1/signin', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false);

    if (result.success && result.data) {
      await this.setToken(result.data.token.access_token);
      if (result.data.token.refresh_token) {
        await this.setRefreshToken(result.data.token.refresh_token);
      }
      await this.setUser(result.data.user);
      return {
        success: true,
        data: result.data.user,
      };
    }

    return {
      success: false,
      error: result.error || 'Login failed',
    };
  }

  async getCurrentUser(): Promise<User | null> {
    // Try to fetch fresh data from API first
    const result = await this.request<User>('/users/v1/me/profile');
    if (result.success && result.data) {
      // Update cache with fresh data
      await this.setUser(result.data);
      return result.data;
    }
    // Fallback to cached data if API fails
    return await this.getUser();
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Products
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return this.request<Product[]>('/team-opnames/v1/products');
  }

  async getProductByBarcode(barcode: string): Promise<ApiResponse<Product>> {
    // Use cached master data instead of fetching all products from API each time
    const masterBarang = await this.getMasterBarang();
    const item = masterBarang.find(p => p.barcode === barcode);
    if (item) {
      return {
        success: true,
        data: {
          id: item.id,
          sku_number: item.sku,
          name: item.nama,
          barcode: item.barcode || '',
          category: { code: '', name: item.category || '' },
          brand: { code: '', name: item.brand || '' },
          group: { code: '', name: item.group || '' },
        },
      };
    }
    return { success: false, error: 'Product not found' };
  }

  // Check Stocks
  async getCheckStocks(): Promise<ApiResponse<CheckStock[]>> {
    return this.request<CheckStock[]>('/team-opnames/v1/check-stocks');
  }

  async createCheckStock(data: CheckStockInput): Promise<ApiResponse<CheckStock>> {
    return this.request<CheckStock>('/team-opnames/v1/check-stocks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCheckStock(checkStockId: string, data: Partial<CheckStockInput>): Promise<ApiResponse<CheckStock>> {
    return this.request<CheckStock>(`/team-opnames/v1/check-stocks/${checkStockId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncMaster = await AsyncStorage.getItem('@last_sync_master');
    const lastSyncCekStok = await AsyncStorage.getItem('@last_sync_cek_stok');
    const pendingData = await AsyncStorage.getItem('@pending_cek_stok');
    const pendingUploads = pendingData ? JSON.parse(pendingData).length : 0;
    return {
      lastSyncMaster: lastSyncMaster,
      lastSyncCekStok: lastSyncCekStok,
      pendingUploads: pendingUploads,
    };
  }

  async syncMasterBarang(): Promise<ApiResponse<void>> {
    try {
      const result = await this.request<Product[]>('/team-opnames/v1/products');
      if (result.success && result.data) {
        await AsyncStorage.setItem('@master_barang', JSON.stringify(result.data));
        await AsyncStorage.setItem('@last_sync_master', new Date().toISOString());
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }

  async logout(): Promise<void> {
    await this.clearAuth();
  }

  async getTeam(): Promise<ApiResponse<Team>> {
    const result = await this.request<any>('/team-opnames/v1/team');
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }

    const teamData = result.data.team || result.data;
    return {
      success: true,
      data: {
        id: String(teamData?.id || ''),
        name: teamData?.name || '',
        opname_stage: teamData?.opname_stage || { id: '', name: '', code: '' },
        members: Array.isArray(teamData?.members) ? teamData.members : [],
        locations: Array.isArray(teamData?.locations) ? teamData.locations : [],
        created_at: teamData?.created_at || '',
      },
    };
  }

  async getOpname(): Promise<ApiResponse<StockOpname>> {
    const result = await this.request<any>('/team-opnames/v1/opname');
    if (!result.success || !result.data || Object.keys(result.data).length === 0) {
      return { success: false, error: result.error || 'Data opname tidak tersedia' };
    }

    const opnameData = result.data.opname || result.data;
    return {
      success: true,
      data: {
        id: String(opnameData?.id || ''),
        name: opnameData?.name || '',
        description: opnameData?.description || '',
        opname_type: opnameData?.opname_type || { id: '', name: '', code: '' },
        opname_stage: opnameData?.opname_stage || { id: '', name: '', code: '' },
        start_date: opnameData?.start_date || '',
        finish_date: opnameData?.finish_date ?? null,
      },
    };
  }

  async deleteCheckStock(checkStockId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/team-opnames/v1/check-stocks/${checkStockId}`, {
      method: 'DELETE',
    });
  }

  // Master Barang
  async getMasterBarang(searchQuery?: string): Promise<MasterBarang[]> {
    const mapProduct = (p: any): MasterBarang => ({
      id: String(p?.id || `product-${Math.random()}`),
      sku: p?.sku_number || '',
      nama: p?.name || '',
      kategori: typeof p?.category === 'object' ? p?.category?.name : p?.category,
      category: typeof p?.category === 'object' ? p?.category?.name : p?.category,
      brand: typeof p?.brand === 'object' ? p?.brand?.name : p?.brand,
      group: typeof p?.group === 'object' ? p?.group?.name : p?.group,
      barcode: p?.barcode,
      kode: p?.sku_number,
    });

    try {
      // Try to get from cache first
      const cachedData = await AsyncStorage.getItem('@master_barang');
      let products: MasterBarang[] = [];
      
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          // Ensure it's an array and map each item
          if (Array.isArray(parsed)) {
            products = parsed.map(mapProduct);
          }
          console.log('Loaded master barang from cache:', products.length, 'items');
        } catch (parseError) {
          console.error('Failed to parse cached master barang:', parseError);
          products = [];
        }
      }
      
      // If no cache or empty, fetch from API
      if (products.length === 0) {
        console.log('Fetching master barang from API...');
        const result = await this.request<Product[]>('/team-opnames/v1/products');
        console.log('API result:', result.success, result.data?.length);
        
        if (result.success && result.data && Array.isArray(result.data)) {
          products = result.data.map(mapProduct).filter(p => p.id && p.sku);
          
          console.log('Mapped products:', products.length);
          // Cache for offline use (store mapped format)
          await AsyncStorage.setItem('@master_barang', JSON.stringify(products));
        }
      }

      if (searchQuery) {
        const filtered = products.filter(p => 
          (p?.nama?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (p?.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
        console.log('Filtered products:', filtered.length);
        return filtered;
      }
      
      return products;
    } catch (error) {
      console.error('Error in getMasterBarang:', error);
      // On error, try to return cached data
      try {
        const cachedData = await AsyncStorage.getItem('@master_barang');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed)) {
            return parsed.map(mapProduct);
          }
        }
      } catch (e) {
        console.error('Failed to return cached data:', e);
      }
      return [];
    }
  }

  async getMasterBarangByKode(kode: string): Promise<MasterBarang | null> {
    const result = await this.getMasterBarang();
    const item = result.find(p => p.sku === kode || p.kode === kode);
    return item || null;
  }

  async getMasterBarangByBarcode(barcode: string): Promise<MasterBarang | null> {
    const result = await this.getMasterBarang();
    const item = result.find(p => p.barcode === barcode);
    return item || null;
  }

  // Cek Stok (legacy aliases for CheckStock)
  async getCekStokItems(searchQuery?: string): Promise<CekStokItem[]> {
    console.log('Fetching check stocks from API...');
    const result = await this.getCheckStocks();
    console.log('Check stocks result:', result.success, result.data?.length, 'items');
    
    if (result.success && result.data && Array.isArray(result.data)) {
      const items: CekStokItem[] = result.data.map((cs, index) => {
        const checkStockId = cs?.check_stock_id ? String(cs.check_stock_id) : undefined;
        const teamRecheckStockId = cs?.team_recheck_stock_id ? String(cs.team_recheck_stock_id) : undefined;
        const isRecheckItem = !!cs?.is_recheck_item;
        const id = checkStockId || (teamRecheckStockId ? `recheck:${teamRecheckStockId}` : `cs-${index}`);

        return {
          id,
          checkStockId,
          teamRecheckStockId,
          isRecheckItem,
          checked: isRecheckItem ? !!cs?.checked : true,
          sku: cs?.sku_number || '',
          nama: cs?.name || '',
          lokasi: cs?.location_name || '',
          qtyBaik: cs?.qty_good || 0,
          qtyRusak: cs?.qty_obsolete || 0,
          createdAt: new Date().toISOString(),
          keterangan: cs?.note,
          barcode: cs?.barcode,
        };
      }).filter(item => item.id && item.sku);
      
      console.log('Mapped check stocks:', items.length, 'items');
      if (items.length > 0) {
        console.log('First item:', items[0]);
      }
      
      if (searchQuery) {
        const filtered = items.filter(i => 
          (i?.nama?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (i?.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        );
        console.log('Filtered check stocks:', filtered.length);
        return filtered;
      }
      return items;
    }
    console.log('No check stocks data returned');
    return [];
  }

  async getCekStokById(id: string): Promise<CekStokItem | null> {
    const result = await this.getCheckStocks();
    if (result.success && result.data) {
      const isRecheckRouteId = id.startsWith('recheck:');
      const recheckId = isRecheckRouteId ? id.replace('recheck:', '') : '';
      const cs = result.data.find(item =>
        item.check_stock_id === id || (recheckId && item.team_recheck_stock_id === recheckId)
      );
      if (cs) {
        const checkStockId = cs.check_stock_id ? String(cs.check_stock_id) : undefined;
        const teamRecheckStockId = cs.team_recheck_stock_id ? String(cs.team_recheck_stock_id) : undefined;
        return {
          id: checkStockId || (teamRecheckStockId ? `recheck:${teamRecheckStockId}` : id),
          checkStockId,
          teamRecheckStockId,
          isRecheckItem: !!cs.is_recheck_item,
          checked: cs.is_recheck_item ? !!cs.checked : true,
          sku: cs.sku_number,
          kode: cs.sku_number, // Add kode field for barcode input
          nama: cs.name,
          lokasi: cs.location_name,
          qtyBaik: cs.qty_good,
          qtyRusak: cs.qty_obsolete,
          keterangan: cs.note,
          barcode: cs.barcode,
          createdAt: new Date().toISOString(),
        };
      }
    }
    return null;
  }

  async saveCekStok(data: Partial<CekStokItem>): Promise<ApiResponse<CekStokItem>> {
    const input: CheckStockInput = {
      sku_number: data.sku || data.kode || '',
      qty_good: data.qtyBaik || 0,
      qty_obsolete: data.qtyRusak || 0,
      location: data.lokasi || '',
      note: data.keterangan,
      barcode: data.barcode,
    };
    
    // Try to send directly to server first
    const result = await this.createCheckStock(input);
    if (result.success && result.data) {
      const item: CekStokItem = {
        id: result.data.check_stock_id,
        sku: result.data.sku_number,
        nama: result.data.name,
        lokasi: result.data.location_name,
        qtyBaik: result.data.qty_good,
        qtyRusak: result.data.qty_obsolete,
        createdAt: new Date().toISOString(),
      };
      return { success: true, data: item };
    }
    
    // If server request fails, store locally for pending sync
    if (result.error?.includes('Network error') || result.error?.includes('Failed to fetch')) {
      const pendingData = await AsyncStorage.getItem('@pending_cek_stok');
      const pendingItems: CekStokItem[] = pendingData ? JSON.parse(pendingData) : [];
      
      const newItem: CekStokItem = {
        id: `pending_${Date.now()}`,
        sku: data.sku || '',
        nama: data.nama || '',
        lokasi: data.lokasi || '',
        qtyBaik: data.qtyBaik || 0,
        qtyRusak: data.qtyRusak || 0,
        keterangan: data.keterangan,
        createdAt: new Date().toISOString(),
      };
      
      pendingItems.push(newItem);
      await AsyncStorage.setItem('@pending_cek_stok', JSON.stringify(pendingItems));
      
      return { success: true, data: newItem, message: 'Data disimpan secara lokal (offline)' };
    }
    
    return { success: false, error: result.error };
  }

  async updateCekStok(id: string, data: Partial<CekStokItem>): Promise<ApiResponse<CekStokItem>> {
    const input: Partial<CheckStockInput> = {};
    if (data.qtyBaik !== undefined) input.qty_good = data.qtyBaik;
    if (data.qtyRusak !== undefined) input.qty_obsolete = data.qtyRusak;
    if (data.lokasi !== undefined) input.location = data.lokasi;
    if (data.keterangan !== undefined) input.note = data.keterangan;
    if (data.barcode !== undefined) input.barcode = data.barcode;
    
    const result = await this.updateCheckStock(id, input);
    if (result.success && result.data) {
      const item: CekStokItem = {
        id: result.data.check_stock_id,
        sku: result.data.sku_number,
        nama: result.data.name,
        lokasi: result.data.location_name,
        qtyBaik: result.data.qty_good,
        qtyRusak: result.data.qty_obsolete,
        createdAt: new Date().toISOString(),
      };
      return { success: true, data: item };
    }
    return { success: false, error: result.error };
  }

  async createRecheckCekStok(teamRecheckStockId: string, data: Partial<CekStokItem>): Promise<ApiResponse<CekStokItem>> {
    const input: CheckStockInput = {
      sku_number: data.sku || data.kode || '',
      qty_good: data.qtyBaik || 0,
      qty_obsolete: data.qtyRusak || 0,
      location: data.lokasi || '',
      note: data.keterangan,
      barcode: data.barcode,
    };

    const result = await this.request<CheckStock>(`/team-opnames/v1/recheck-items/${teamRecheckStockId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          id: result.data.check_stock_id || `recheck:${teamRecheckStockId}`,
          checkStockId: result.data.check_stock_id,
          teamRecheckStockId: result.data.team_recheck_stock_id || teamRecheckStockId,
          isRecheckItem: true,
          checked: true,
          sku: result.data.sku_number,
          nama: result.data.name,
          lokasi: result.data.location_name,
          qtyBaik: result.data.qty_good,
          qtyRusak: result.data.qty_obsolete,
          keterangan: result.data.note,
          barcode: result.data.barcode,
          createdAt: new Date().toISOString(),
        },
      };
    }

    return { success: false, error: result.error };
  }

  async updateRecheckCekStok(teamRecheckStockId: string, data: Partial<CekStokItem>): Promise<ApiResponse<CekStokItem>> {
    const input: Partial<CheckStockInput> = {};
    if (data.qtyBaik !== undefined) input.qty_good = data.qtyBaik;
    if (data.qtyRusak !== undefined) input.qty_obsolete = data.qtyRusak;
    if (data.lokasi !== undefined) input.location = data.lokasi;
    if (data.keterangan !== undefined) input.note = data.keterangan;
    if (data.barcode !== undefined) input.barcode = data.barcode;

    const result = await this.request<CheckStock>(`/team-opnames/v1/recheck-items/${teamRecheckStockId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });

    if (result.success && result.data) {
      return {
        success: true,
        data: {
          id: result.data.check_stock_id || `recheck:${teamRecheckStockId}`,
          checkStockId: result.data.check_stock_id,
          teamRecheckStockId: result.data.team_recheck_stock_id || teamRecheckStockId,
          isRecheckItem: true,
          checked: true,
          sku: result.data.sku_number,
          nama: result.data.name,
          lokasi: result.data.location_name,
          qtyBaik: result.data.qty_good,
          qtyRusak: result.data.qty_obsolete,
          keterangan: result.data.note,
          barcode: result.data.barcode,
          createdAt: new Date().toISOString(),
        },
      };
    }

    return { success: false, error: result.error };
  }

  async deleteCekStok(id: string): Promise<ApiResponse<void>> {
    return this.deleteCheckStock(id);
  }

  async getTahapOpname(): Promise<string> {
    const result = await this.getOpname();
    if (result.success && result.data) {
      return result.data.opname_stage?.code || 'CL';
    }
    return 'CL';
  }

  async syncCekStokToServer(): Promise<ApiResponse<void>> {
    try {
      const pendingData = await AsyncStorage.getItem('@pending_cek_stok');
      const pendingItems: CekStokItem[] = pendingData ? JSON.parse(pendingData) : [];
      
      if (pendingItems.length === 0) {
        return { success: true, message: 'Tidak ada data pending' };
      }

      for (const item of pendingItems) {
        const input: CheckStockInput = {
          sku_number: item.sku,
          qty_good: item.qtyBaik,
          qty_obsolete: item.qtyRusak,
          location: item.lokasi,
          note: item.keterangan,
        };
        const result = await this.createCheckStock(input);
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }

      await AsyncStorage.removeItem('@pending_cek_stok');
      await AsyncStorage.setItem('@last_sync_cek_stok', new Date().toISOString());
      return { success: true, message: `${pendingItems.length} data berhasil dikirim` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
    }
  }
}

const apiService = new ApiService();
export default apiService;
