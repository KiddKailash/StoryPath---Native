import React from "react";
import { Drawer } from "expo-router/drawer";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons, Entypo, Foundation, FontAwesome6 } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import { Text, Image, StyleSheet } from "react-native";

// Import AsyncStorage and useDrawerStatus
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDrawerStatus } from "@react-navigation/drawer";

/**
 * DrawerItemComponent renders a customizable item within the drawer.
 *
 * @param {object} props - The properties passed to the component.
 * @param {string} props.label - The label text for the drawer item.
 * @param {string} props.routeName - The route name to navigate to on press.
 * @param {React.Component} props.IconComponent - The icon component to display.
 * @param {string} props.iconName - The name of the icon to display.
 * @returns {JSX.Element} The rendered DrawerItemComponent.
 */
const DrawerItemComponent = ({ label, routeName, IconComponent, iconName }) => {
  const router = useRouter(); // Hook to access router for navigation
  const pathname = usePathname(); // Current path name
  const isActive = pathname === routeName; // Determine if the item is active

  return (
    <DrawerItem
      icon={({ size }) => (
        <IconComponent
          name={iconName} // Icon name
          size={size} // Icon size
          color={isActive ? "#fff" : "#000"} // Icon color based on active state
        />
      )}
      label={label} // Label text
      labelStyle={[
        styles.navItemLabel,
        { color: isActive ? "#fff" : "#000" }, // Label color based on active state
      ]}
      style={{ backgroundColor: isActive ? "#333" : "#fff" }} // Background color based on active state
      onPress={() => router.push(routeName)} // Navigate to the specified route on press
    />
  );
};

/**
 * ProfileDrawerItem displays the user's profile information in the drawer.
 * If the user is not logged in, it shows a login prompt.
 *
 * @returns {JSX.Element} The rendered ProfileDrawerItem.
 */
const ProfileDrawerItem = () => {
  const router = useRouter(); // Hook to access router for navigation
  const [username, setUsername] = React.useState(null); // State to hold the username
  const [imageUri, setImageUri] = React.useState(null); // State to hold the profile image URI
  const isDrawerOpen = useDrawerStatus(); // Status of the drawer (open or closed)

  /**
   * loadProfileData retrieves the user's profile data from AsyncStorage.
   */
  const loadProfileData = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem("username"); // Retrieve saved username
      const savedImageUri = await AsyncStorage.getItem("imageUri"); // Retrieve saved image URI
      setUsername(savedUsername); // Update username state
      setImageUri(savedImageUri); // Update imageUri state
    } catch (error) {
      console.error("Error loading profile data:", error); // Log any errors
    }
  };

  // Load profile data on component mount
  React.useEffect(() => {
    loadProfileData();
  }, []);

  // Reload profile data when the drawer is opened
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
            source={{ uri: imageUri }} // User's profile image
            style={{ width: size, height: size, borderRadius: size / 2 }} // Styling for the image
          />
        ) : (
          <Ionicons name="person-add" size={size} color="#000" /> // Default icon if no profile image
        )
      }
      label={() => (
        <Text style={[styles.navItemLabel, { color: "#000" }]}>
          {username ? username : "Login"} {/* Display username or "Login" */}
        </Text>
      )}
      onPress={() => router.push("/profile")} // Navigate to the profile screen on press
    />
  );
};

/**
 * CustomDrawerContent defines the content of the drawer, including navigation items.
 *
 * @param {object} props - The properties passed to the drawer content.
 * @returns {JSX.Element} The rendered CustomDrawerContent.
 */
const CustomDrawerContent = (props) => {
  const router = useRouter(); // Hook to access router for navigation
  const pathname = usePathname(); // Current path name
  const isActive = pathname === "/"; // Determine if the current route is the home screen

  return (
    <DrawerContentScrollView {...props}>
      {/* Story Path Button with Home Icon */}
      <DrawerItem
        icon={({ size }) => (
          <Entypo name="home" size={size} color={isActive ? "#fff" : "#000"} /> // Home icon
        )}
        label="Story Path" // Label for the home item
        labelStyle={[
          styles.appTitle,
          { color: isActive ? "#fff" : "#000" }, // Label color based on active state
        ]}
        style={[
          styles.header,
          { backgroundColor: isActive ? "#333" : "#fff" }, // Background color based on active state
        ]}
        onPress={() => router.push("/")} // Navigate to home on press
      />

      {/* Profile Drawer Item */}
      <ProfileDrawerItem />

      {/* Other Drawer Items */}
      <DrawerItemComponent
        label="Projects" // Label for the Projects item
        routeName="/projectsList" // Route name for Projects
        IconComponent={Foundation} // Icon component for Projects
        iconName="mountains" // Icon name for Projects
      />
      <DrawerItemComponent
        label="About" // Label for the About item
        routeName="/about" // Route name for About
        IconComponent={FontAwesome6} // Icon component for About
        iconName="clipboard-question" // Icon name for About
      />
    </DrawerContentScrollView>
  );
};

/**
 * Layout component sets up the drawer navigation for the application.
 *
 * @returns {JSX.Element} The Layout component with configured drawer navigation.
 */
export default function Layout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />} // Custom drawer content
      screenOptions={{ headerShown: false }} // Hide default header
    >
      <Drawer.Screen
        name="index" // Route name for Home
        options={{ headerShown: true, headerTitle: "Home" }} // Show header with title
      />
      <Drawer.Screen
        name="about" // Route name for About
        options={{ headerShown: true, headerTitle: "About" }} // Show header with title
      />
      <Drawer.Screen
        name="profile" // Route name for Profile
        options={{ headerShown: true, headerTitle: "Profile" }} // Show header with title
      />
      <Drawer.Screen
        name="projectsList" // Route name for Projects List
        options={{ headerShown: true, headerTitle: "Projects" }} // Show header with title
      />
    </Drawer>
  );
}

/**
 * styles defines the styling for various components within the drawer.
 */
const styles = StyleSheet.create({
  navItemLabel: {
    marginLeft: 0, // No left margin
    fontSize: 18, // Font size
  },
  header: {
    paddingVertical: 15, // Vertical padding
    borderColor: "#ccc", // Border color
    borderBottomWidth: 1, // Bottom border width
    marginBottom: 10, // Bottom margin
  },
  appTitle: {
    fontSize: 20, // Font size for the app title
    fontWeight: "bold", // Bold font weight
  },
});
