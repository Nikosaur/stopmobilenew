import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, SyncStatus, User, Team, StockOpname } from '../types';
import api from '../services/api';
import BottomNavigation from '../components/BottomNavigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncMaster: null,
    lastSyncCekStok: null,
    pendingUploads: 0,
  });
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [opname, setOpname] = useState<StockOpname | null>(null);
  const [masterCount, setMasterCount] = useState(0);

  useEffect(() => {
    loadSyncStatus();
    loadUser();
    loadTeam();
    loadOpname();
    loadMasterCount();
  }, []);

  const loadSyncStatus = async () => {
    const status = await api.getSyncStatus();
    setSyncStatus(status);
  };

  const loadUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    }
  };

  const loadTeam = async () => {
    try {
      const result = await api.getTeam();
      if (result.success && result.data) {
        setTeam(result.data);
      } else {
        console.error('Failed to load team:', result.error);
        setTeam(null);
      }
    } catch (error) {
      console.error('Error loading team:', error);
      setTeam(null);
    }
  };

  const loadOpname = async () => {
    try {
      const result = await api.getOpname();
      if (result.success && result.data) {
        setOpname(result.data);
      } else {
        console.error('Failed to load opname:', result.error);
        setOpname(null);
      }
    } catch (error) {
      console.error('Error loading opname:', error);
      setOpname(null);
    }
  };

  const loadMasterCount = async () => {
    try {
      const result = await api.getMasterBarang();
      setMasterCount(result.length);
    } catch (error) {
      console.error('Failed to load master count:', error);
      setMasterCount(0);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await api.syncMasterBarang();
    setSyncing(false);

    if (result.success) {
      Alert.alert('Sukses', 'Data berhasil disinkronisasi');
      loadSyncStatus();
      loadMasterCount();
    } else {
      Alert.alert('Error', result.error || 'Gagal sinkronisasi');
    }
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

  const ActivityIcon = () => (
    <View style={styles.activityIcon}>
      <View style={styles.activityLine} />
      <View style={[styles.activityLine, styles.activityLine2]} />
      <View style={[styles.activityLine, styles.activityLine3]} />
    </View>
  );

  const PackageIcon = () => (
    <View style={styles.packageIcon}>
      <View style={styles.packageBox}>
        <View style={styles.packageTop} />
        <View style={styles.packageFront} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome Back, {user?.name || '-'}</Text>
        <TouchableOpacity onPress={handleSync} style={styles.syncButton}>
          <Text style={styles.syncIcon}>⟳</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Menu Icons */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CekStok')}
          >
            <View style={styles.menuIconContainer}>
              <ActivityIcon />
            </View>
            <Text style={styles.menuLabel}>Cek Stok</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MasterBarang')}
          >
            <View style={styles.menuIconContainer}>
              <PackageIcon />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{masterCount}</Text>
              </View>
            </View>
            <Text style={styles.menuLabel}>Master Barang</Text>
          </TouchableOpacity>
        </View>

        {/* Opname Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opname Berjalan</Text>
          <View style={styles.infoTable}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jenis Opname</Text>
              <Text style={styles.infoValue}>{opname?.name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tahap</Text>
              <Text style={styles.infoValue}>{opname?.opname_stage?.name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tgl Start</Text>
              <Text style={styles.infoValue}>{opname?.start_date || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tgl Selesai</Text>
              <Text style={styles.infoValue}>{opname?.finish_date || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Deskripsi</Text>
              <Text style={styles.infoValue}>{opname?.description || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Team Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team</Text>
          <View style={styles.infoTable}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama Tim</Text>
              <Text style={styles.infoValue}>{team?.name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tahap Opname Tim</Text>
              <Text style={styles.infoValue}>{team?.opname_stage?.name || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Anggota</Text>
              <Text style={styles.infoValue}>
                {team?.members?.map(m => `${m.name} (${m.nip})`).join(', ') || '-'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a2744',
  },
  welcomeText: {
    fontSize: 14,
    color: '#fff',
  },
  syncButton: {
    padding: 8,
  },
  syncIcon: {
    fontSize: 18,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    backgroundColor: '#1a2744',
  },
  menuItem: {
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  menuLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#fff',
  },
  // Activity Icon
  activityIcon: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  activityLine: {
    width: 3,
    height: 20,
    backgroundColor: '#f90',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  activityLine2: {
    height: 30,
  },
  activityLine3: {
    height: 15,
  },
  // Package Icon
  packageIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  packageBox: {
    width: 32,
    height: 28,
    position: 'relative',
  },
  packageTop: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 8,
    backgroundColor: '#f90',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  packageFront: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#f90',
    backgroundColor: 'transparent',
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#e91e63',
    borderRadius: 10,
    minWidth: 36,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoTable: {
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1.5,
    textAlign: 'right',
  },
});
