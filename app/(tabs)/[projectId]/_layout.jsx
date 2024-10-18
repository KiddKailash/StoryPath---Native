import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Button } from "react-native";
import { useNavigation } from "expo-router";

const HeaderLeftButton = () => {
  const navigation = useNavigation();

  return (
    <Button
      onPress={() => navigation.navigate("projectsList")}
      title="<< Projects"
    />
  );
};

export default function Project() {
  return (
    <Tabs
      screenOptions={{
        headerLeft: () => <HeaderLeftButton />,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} />
          ),
          tabBarLabel: "Overview",
          headerTitle: "Overview",
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="map" size={24} color={color} />
          ),
          tabBarLabel: "Map",
          headerTitle: "Map",
        }}
      />
      <Tabs.Screen
        name="qrScanner"
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="camera" size={24} color={color} />
          ),
          tabBarLabel: "QR Scanner",
          headerTitle: "QR Scanner",
        }}
      />
    </Tabs>
  );
}
