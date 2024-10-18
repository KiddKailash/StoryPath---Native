// _layout.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import {
  Ionicons,
  Entypo,
  Foundation,
  FontAwesome6,
} from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDrawerStatus } from '@react-navigation/drawer';

const DrawerItemComponent = ({
  label,
  routeName,
  IconComponent,
  iconName,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === routeName;

  return (
    <DrawerItem
      icon={({ size }) => (
        <IconComponent
          name={iconName}
          size={size}
          color={isActive ? '#fff' : '#000'}
        />
      )}
      label={label}
      labelStyle={[
        styles.navItemLabel,
        { color: isActive ? '#fff' : '#000' },
      ]}
      style={{ backgroundColor: isActive ? '#333' : '#fff' }}
      onPress={() => router.push(routeName)}
    />
  );
};

const CustomDrawerContent = (props) => {
  const router = useRouter();
  const [username, setUsername] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  const isDrawerOpen = useDrawerStatus();

  const loadProfileData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedImageUri = await AsyncStorage.getItem('imageUri');
      setUsername(savedUsername);
      setImageUri(savedImageUri);
    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  useEffect(() => {
    // Load profile data when the component mounts
    loadProfileData();
  }, []);

  useEffect(() => {
    if (isDrawerOpen === 'open') {
      // Reload profile data when the drawer is opened
      loadProfileData();
    }
  }, [isDrawerOpen]);

  return (
    <DrawerContentScrollView {...props}>
      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => router.push('/profile')}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <Image
            source={require('../assets/images/storypath-icon.png')} // Replace with your default image path
            style={styles.profileImage}
            size={12}
          />
        )}
        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>
            {username ? username : 'No Profile Logged In'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Drawer Items */}
      <DrawerItemComponent
        label="Welcome"
        routeName="/"
        IconComponent={Entypo}
        iconName="home"
      />
      <DrawerItemComponent
        label="Profile"
        routeName="/profile"
        IconComponent={Ionicons}
        iconName="person-add"
      />
      <DrawerItemComponent
        label="Projects"
        routeName="/projectsList"
        IconComponent={Foundation}
        iconName="mountains"
      />
      <DrawerItemComponent
        label="About"
        routeName="/about"
        IconComponent={FontAwesome6}
        iconName="clipboard-question"
      />
    </DrawerContentScrollView>
  );
};

export default function Layout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen
        name="index"
        options={{ headerShown: true, headerTitle: 'Home' }}
      />
      <Drawer.Screen
        name="about"
        options={{ headerShown: true, headerTitle: 'About' }}
      />
      <Drawer.Screen
        name="profile"
        options={{ headerShown: true, headerTitle: 'Profile' }}
      />
      <Drawer.Screen
        name="projectsList"
        options={{ headerShown: true, headerTitle: 'Projects' }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  navItemLabel: {
    marginLeft: -20,
    fontSize: 18,
  },
  profileContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ccc', // Placeholder background color
  },
  profileDetails: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
