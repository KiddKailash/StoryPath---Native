// _layout.jsx

import React from "react";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons, Entypo, Foundation, FontAwesome6 } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { Text, Image, StyleSheet } from "react-native";

// Import AsyncStorage and useDrawerStatus
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDrawerStatus } from "@react-navigation/drawer";

const DrawerItemComponent = ({ label, routeName, IconComponent, iconName }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === routeName;

  return (
    <DrawerItem
      icon={({ size }) => (
        <IconComponent
          name={iconName}
          size={size}
          color={isActive ? "#fff" : "#000"}
        />
      )}
      label={label}
      labelStyle={[
        styles.navItemLabel,
        { color: isActive ? "#fff" : "#000" },
      ]}
      style={{ backgroundColor: isActive ? "#333" : "#fff" }}
      onPress={() => router.push(routeName)}
    />
  );
};

const ProfileDrawerItem = () => {
  const router = useRouter();
  const [username, setUsername] = React.useState(null);
  const [imageUri, setImageUri] = React.useState(null);
  const isDrawerOpen = useDrawerStatus();

  const loadProfileData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem("username");
      const savedImageUri = await AsyncStorage.getItem("imageUri");
      setUsername(savedUsername);
      setImageUri(savedImageUri);
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  React.useEffect(() => {
    loadProfileData();
  }, []);

  React.useEffect(() => {
    if (isDrawerOpen === "open") {
      loadProfileData();
    }
  }, [isDrawerOpen]);

  return (
    <DrawerItem
      icon={({ size }) =>
        username && imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
          />
        ) : (
          <Ionicons name="person-add" size={size} color="#000" />
        )
      }
      label={() => (
        <Text style={[styles.navItemLabel, { color: "#000" }]}>
          {username ? username : "Login"}
        </Text>
      )}
      onPress={() => router.push("/profile")}
    />
  );
};

const CustomDrawerContent = (props) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === "/";

  return (
    <DrawerContentScrollView {...props}>
      {/* Story Path Button with Home Icon */}
      <DrawerItem
        icon={({ size }) => (
          <Entypo name="home" size={size} color={isActive ? "#fff" : "#000"} />
        )}
        label="Story Path"
        labelStyle={[
          styles.appTitle,
          { color: isActive ? "#fff" : "#000" },
        ]}
        style={[
          styles.header,
          { backgroundColor: isActive ? "#333" : "#fff" },
        ]}
        onPress={() => router.push("/")}
      />

      {/* Profile Drawer Item */}
      <ProfileDrawerItem />

      {/* Other Drawer Items */}
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
        options={{ headerShown: true, headerTitle: "Home" }}
      />
      <Drawer.Screen
        name="about"
        options={{ headerShown: true, headerTitle: "About" }}
      />
      <Drawer.Screen
        name="profile"
        options={{ headerShown: true, headerTitle: "Profile" }}
      />
      <Drawer.Screen
        name="projectsList"
        options={{ headerShown: true, headerTitle: "Projects" }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  navItemLabel: {
    marginLeft: 0,
    fontSize: 18,
  },
  header: {
    paddingVertical: 15,
    borderColor: "#ccc",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
