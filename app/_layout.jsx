import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons, Entypo, Foundation, FontAwesome6 } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const DrawerItemComponent = ({ label, routeName, IconComponent, iconName }) => {
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
      labelStyle={[styles.navItemLabel, { color: isActive ? "#fff" : "#000" }]}
      style={{ backgroundColor: isActive ? "#333" : "#fff" }}
      onPress={() => router.push(routeName)}
    />
  );
};

const CustomDrawerContent = (props) => (
  <DrawerContentScrollView {...props}>
    <View style={styles.infoContainer}>
      <View style={styles.infoDetailsContainer}>
        <Text style={styles.appTitle}>Story Path</Text>
      </View>
    </View>

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
        name="projectsList" // Added ProjectsList screen
        options={{ headerShown: true, headerTitle: "Projects" }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  navItemLabel: {
    marginLeft: -20,
    fontSize: 18,
  },
  infoContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
  },
  infoDetailsContainer: {
    marginTop: 25,
    marginLeft: 10,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
