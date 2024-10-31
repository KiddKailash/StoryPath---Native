import { View, Text, Button, StyleSheet } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

export default function About() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About Page</Text>
      <Text style={styles.description}>
        This app is designed to provide users with insights into various projects,
        allowing them to explore details, track progress, and stay updated with the
        latest information. Built with React Native and Expo, it’s optimized for a
        smooth user experience across multiple platforms.
      </Text>
      <Button onPress={() => router.back()} title='Go Back' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
});
