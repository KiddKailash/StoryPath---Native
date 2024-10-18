import React from 'react';
import { Tabs } from 'expo-router';

export default function Project() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="qrScanner" options={{ title: 'QR Scanner' }} />
    </Tabs>
  );
}
