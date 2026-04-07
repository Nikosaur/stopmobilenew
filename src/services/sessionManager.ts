import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const LAST_ACTIVE_KEY = '@last_active_timestamp';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class SessionManager {
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;

    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );

    this.isInitialized = true;
  }

  cleanup() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    console.log('AppState changed to:', nextAppState);

    if (nextAppState === 'active') {
      // App came to foreground - check session validity
      await this.checkSessionValidity();
      // Update last active timestamp
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    } else if (nextAppState === 'background') {
      // App went to background - just update timestamp, don't logout
      await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }
    // 'inactive' state is temporary (e.g., during app switch), don't logout
  };

  private async checkSessionValidity() {
    try {
      const lastActive = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
      
      if (lastActive) {
        const lastActiveTime = parseInt(lastActive, 10);
        const currentTime = Date.now();
        const timeDiff = currentTime - lastActiveTime;

        // If session expired (inactive for more than SESSION_TIMEOUT)
        if (timeDiff > SESSION_TIMEOUT) {
          console.log('Session expired after', timeDiff, 'ms of inactivity');
          await api.clearAuth();
          return false;
        }
      }

      // Try to refresh token when coming back to active
      const isAuth = await api.isAuthenticated();
      if (isAuth) {
        // Token refresh happens automatically on 401 in the api service
        // But we can verify the session is still valid
        const user = await api.getCurrentUser();
        if (!user) {
          console.log('Session invalid - user not found');
          await api.clearAuth();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  }

  async clearSession() {
    await AsyncStorage.removeItem(LAST_ACTIVE_KEY);
    await api.clearAuth();
  }

  async startSession() {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  }
}

const sessionManager = new SessionManager();
export default sessionManager;
