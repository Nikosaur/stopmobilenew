import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

interface BottomNavigationProps {
  navigation: NavigationProp<RootStackParamList>;
  activeScreen: 'Home' | 'Akun';
}

export default function BottomNavigation({ navigation, activeScreen }: BottomNavigationProps) {
  const isHomeActive = activeScreen === 'Home';
  const isAkunActive = activeScreen === 'Akun';

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => !isHomeActive && navigation.navigate('Home')}
      >
        <View style={styles.navIconContainer}>
          <View style={[styles.homeIcon, isHomeActive && styles.activeIcon]}>
            <View style={[styles.homeRoof, isHomeActive && styles.activeRoof]} />
            <View style={[styles.homeBody, isHomeActive && styles.activeBody]} />
          </View>
        </View>
        <Text style={[styles.navLabel, isHomeActive && styles.activeLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => !isAkunActive && navigation.navigate('Akun')}
      >
        <View style={styles.navIconContainer}>
          <View style={styles.profileIcon}>
            <View style={[styles.profileHead, isAkunActive && styles.activeProfile]} />
            <View style={[styles.profileBody, isAkunActive && styles.activeProfile]} />
          </View>
        </View>
        <Text style={[styles.navLabel, isAkunActive && styles.activeLabel]}>Akun</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  navItem: {
    alignItems: 'center',
  },
  navIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  activeLabel: {
    color: '#f90',
  },
  // Home Icon
  homeIcon: {
    width: 20,
    height: 20,
    alignItems: 'center',
  },
  homeRoof: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#999',
  },
  homeBody: {
    width: 16,
    height: 10,
    backgroundColor: '#999',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  activeIcon: {},
  activeRoof: {
    borderBottomColor: '#f90',
  },
  activeBody: {
    backgroundColor: '#f90',
  },
  // Profile Icon
  profileIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#999',
    backgroundColor: 'transparent',
  },
  profileBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 1.5,
    borderColor: '#999',
    borderBottomWidth: 0,
    marginTop: 2,
  },
  activeProfile: {
    borderColor: '#f90',
  },
});
