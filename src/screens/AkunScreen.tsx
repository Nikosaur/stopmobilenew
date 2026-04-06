import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, User } from '../types';
import api from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

type AkunScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Akun'>;

interface AkunScreenProps {
  navigation: AkunScreenNavigationProp;
}

export default function AkunScreen({ navigation }: AkunScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userData = await api.getCurrentUser();
    setUser(userData);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Konfirmasi',
      'Apakah anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await api.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleCrashReport = () => {
    Alert.alert('Info', 'Fitur Kirim Crash Report akan segera tersedia');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Akun</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user?.username || '-'}</Text>
            <Text style={styles.role}>{user?.tahapOpname || 'Team Opname'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} onPress={handleCrashReport}>
            <Text style={styles.menuText}>Kirim Crash Report</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={styles.menuText}>Logout</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>App Version 1.7</Text>
          <Text style={styles.stagingText}>Staging</Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation navigation={navigation} activeScreen="Akun" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a2744',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatarIcon: {
    fontSize: 28,
  },
  profileInfo: {
    marginLeft: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  role: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#999',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  stagingText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
