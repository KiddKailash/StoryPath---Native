// _layout.jsx

import React from "react";
import { Tabs, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "react-native";
import { useNavigation } from "expo-router";

/**
 * HeaderLeftButton component renders a button that navigates back to the projects list.
 *
 * @returns {JSX.Element} The rendered Button component.
 */
const HeaderLeftButton = () => {
  const navigation = useNavigation(); // Hook to access navigation

  return (
    <Button
      onPress={() => navigation.navigate("projectsList")} // Navigate to "projectsList" screen on press
      title="<< Projects" // Button title
    />
  );
};

/**
 * Layout component defines the main tab navigation layout for the app,
 * including "Overview", "Map", and "QR Scanner" tabs.
 *
 * @returns {JSX.Element} The rendered Tabs component.
 */
export default function Layout() {
  const { projectId } = useLocalSearchParams(); // Retrieve projectId from URL parameters

  return (
    <Tabs
      screenOptions={{
        headerLeft: () => <HeaderLeftButton />, // Set the header left button
      }}
    >
      {/* Home Screen Tab */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} /> // Overview icon
          ),
          tabBarLabel: "Overview", // Label for the Overview tab
          headerTitle: "Overview", // Title in the header
        }}
        initialParams={{ projectId }} // Pass projectId as initial parameter
      />

      {/* Map Screen Tab */}
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="map" size={24} color={color} /> // Map icon
          ),
          tabBarLabel: "Map", // Label for the Map tab
          headerTitle: "Map", // Title in the header
        }}
        initialParams={{ projectId }} // Pass projectId as initial parameter
      />

      {/* QR Scanner Screen Tab */}
      <Tabs.Screen
        name="qrScanner"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="camera" size={24} color={color} /> // QR Scanner icon
          ),
          tabBarLabel: "QR Scanner", // Label for the QR Scanner tab
          headerTitle: "QR Scanner", // Title in the header
        }}
        initialParams={{ projectId }} // Pass projectId as initial parameter
      />
    </Tabs>
  );
}
