import React from "react";
import { Tabs, useLocalSearchParams } from "expo-router";
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

export default function Layout() {
  const { projectId } = useLocalSearchParams();

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
        initialParams={{ projectId }}
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
        initialParams={{ projectId }}
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
        initialParams={{ projectId }}
      />
    </Tabs>
  );
}
