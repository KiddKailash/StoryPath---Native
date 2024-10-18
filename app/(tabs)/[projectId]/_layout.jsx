import React from "react";
import { Tabs } from "expo-router";

export default function Project() {
  return (
    <Tabs>
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
      <Tabs.Screen name="map" options={{
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} />
          ),
          tabBarLabel: "Map",
          headerTitle: "Map",
        }} />
      <Tabs.Screen name="qrScanner" options={{
          tabBarIcon: ({ color }) => (
            <Feather name="list" size={24} color={color} />
          ),
          tabBarLabel: "Qr Scanner",
          headerTitle: "Qr Scanner",
        }} />
    </Tabs>
  );
}
