import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, StockItem, StockCheckInput, ApiResponse } from '../types';

// TODO: Replace with your actual backend API base URL
const API_BASE_URL = 'https://your-api-endpoint.com/api/v1';

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await this.getHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          await this.clearToken();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Authentication
  async login(username: string, password: string): Promise<ApiResponse<User>> {
    // TODO: Replace with your actual login endpoint
    // const result = await this.request<User>('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify({ username, password }),
    // });

    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === 'admin' && password === 'admin') {
          const user: User = {
            id: '1',
            username: 'admin',
            name: 'Admin User',
            role: 'admin',
            token: 'mock-jwt-token-12345',
          };
          this.setToken(user.token);
          resolve({ success: true, data: user });
        } else {
          resolve({ success: false, error: 'Invalid username or password' });
        }
      }, 1000);
    });
  }

  async logout(): Promise<void> {
    await this.clearToken();
  }

  // Stock APIs
  async getStockItems(search?: string, zone?: string): Promise<ApiResponse<StockItem[]>> {
    // TODO: Replace with your actual endpoint
    // const params = new URLSearchParams();
    // if (search) params.append('search', search);
    // if (zone) params.append('zone', zone);
    // return this.request<StockItem[]>(`/stock/items?${params.toString()}`);

    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockItems: StockItem[] = [
          {
            id: '1',
            barcode: '123456789012',
            name: 'Wireless Mouse',
            sku: 'WM-001',
            location: 'A-01',
            zone: 'Electronics',
            shelf: 'Shelf-1',
            quantity: 50,
            expectedQuantity: 50,
            unit: 'pcs',
            category: 'Accessories',
            status: 'matched',
          },
          {
            id: '2',
            barcode: '987654321098',
            name: 'USB-C Cable',
            sku: 'USB-002',
            location: 'A-02',
            zone: 'Electronics',
            shelf: 'Shelf-2',
            quantity: 100,
            expectedQuantity: 100,
            unit: 'pcs',
            category: 'Cables',
            status: 'matched',
          },
        ];
        resolve({ success: true, data: mockItems });
      }, 500);
    });
  }

  async getStockByBarcode(barcode: string): Promise<ApiResponse<StockItem>> {
    // TODO: Replace with your actual endpoint
    // return this.request<StockItem>(`/stock/barcode/${barcode}`);

    return new Promise((resolve) => {
      setTimeout(() => {
        if (barcode === '123456789012') {
          resolve({
            success: true,
            data: {
              id: '1',
              barcode: '123456789012',
              name: 'Wireless Mouse',
              sku: 'WM-001',
              location: 'A-01',
              zone: 'Electronics',
              shelf: 'Shelf-1',
              quantity: 50,
              expectedQuantity: 50,
              unit: 'pcs',
              category: 'Accessories',
              status: 'matched',
            },
          });
        } else {
          resolve({ success: false, error: 'Item not found' });
        }
      }, 500);
    });
  }

  async updateStockCheck(input: StockCheckInput): Promise<ApiResponse<StockItem>> {
    // TODO: Replace with your actual endpoint
    // return this.request<StockItem>('/stock/check', {
    //   method: 'POST',
    //   body: JSON.stringify(input),
    // });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            id: input.stockId,
            barcode: '123456789012',
            name: 'Wireless Mouse',
            sku: 'WM-001',
            location: 'A-01',
            zone: 'Electronics',
            shelf: 'Shelf-1',
            quantity: input.actualQuantity,
            expectedQuantity: 50,
            unit: 'pcs',
            category: 'Accessories',
            status: input.status === 'matched' ? 'matched' : 'mismatch',
            lastChecked: new Date().toISOString(),
            notes: input.notes,
          },
        });
      }, 500);
    });
  }

  // Offline sync
  async syncOfflineData(): Promise<ApiResponse<void>> {
    const offlineData = await AsyncStorage.getItem('offline_stock_checks');
    if (!offlineData) {
      return { success: true };
    }

    const checks: StockCheckInput[] = JSON.parse(offlineData);
    const failedChecks: StockCheckInput[] = [];

    for (const check of checks) {
      const result = await this.updateStockCheck(check);
      if (!result.success) {
        failedChecks.push(check);
      }
    }

    if (failedChecks.length > 0) {
      await AsyncStorage.setItem('offline_stock_checks', JSON.stringify(failedChecks));
      return {
        success: false,
        error: `${failedChecks.length} items failed to sync`,
      };
    } else {
      await AsyncStorage.removeItem('offline_stock_checks');
      return { success: true };
    }
  }
}

export default ApiService.getInstance();
