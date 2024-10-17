import { View, Text, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";

const CustomDrawerContent = (props) => {
  const pathname = usePathname();

  useEffect(() => {
    console.log("Current Path", pathname);
  }, [pathname]);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.infoContainer}>
        <View style={styles.infoDetailsContainer}>
          <Text style={styles.appTitle}>Drawer Tabs Example</Text>
        </View>
      </View>
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="list"
            size={size}
            color={pathname == "/" ? "#fff" : "#000"}
          />
        )}
        label={"Welcome"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/");
        }}
      />
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="list"
            size={size}
            color={pathname == "/about" ? "#fff" : "#000"}
          />
        )}
        label={"About"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/about" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/about" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/about");
        }}
      />
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="list"
            size={size}
            color={pathname == "/profile" ? "#fff" : "#000"}
          />
        )}
        label={"Profile"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/profile" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/profile" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/profile");
        }}
      />
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="list"
            size={size}
            color={pathname == "/blog" ? "#fff" : "#000"}
          />
        )}
        label={"Blog"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/blog" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/blog" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/(tabs)/blog");
        }}
      />
      <DrawerItem
        icon={({ color, size }) => (
          <Feather
            name="list"
            size={size}
            color={pathname == "/tips" ? "#fff" : "#000"}
          />
        )}
        label={"Tips"}
        labelStyle={[
          styles.navItemLabel,
          { color: pathname == "/tips" ? "#fff" : "#000" },
        ]}
        style={{ backgroundColor: pathname == "/tips" ? "#333" : "#fff" }}
        onPress={() => {
          router.push("/(tabs)/tips");
        }}
      />
    </DrawerContentScrollView>
  );
};

export default function Layout() {
  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />} screenOptions={{headerShown: false}}>
      <Drawer.Screen name="index" options={{headerShown: true, headerTitle: "Home"}}  />
      <Drawer.Screen name="about" options={{headerShown: true, headerTitle: "About"}} />
      <Drawer.Screen name="profile" options={{headerShown: true, headerTitle: "Profile"}} />
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
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  infoDetailsContainer: {
    marginTop: 25,
    marginLeft: 10,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  }
});
