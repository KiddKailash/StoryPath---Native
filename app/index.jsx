// index.jsx

import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  const navigateToProfile = () => {
    router.push('/profile');
  };

  const navigateToProjectsList = () => {
    router.push('/projectsList');
  };

  return (
    <View style={styles.container}>
      {/* Display the image */}
      <Image
        source={require('../assets/images/storypath-icon.png')} // Make sure to add an image in the assets folder
        style={styles.image}
        resizeMode="contain"
      />

      {/* Display the title text */}
      <Text style={styles.title}>Story Path</Text>

      {/* Display the welcome message */}
      <Text style={styles.message}>
        Explore amazing projects and create your own stories!
      </Text>

      {/* Buttons to navigate to Profile and Projects List */}
      <View style={styles.buttonContainer}>
        <Button title="Go to Profile" onPress={navigateToProfile} />
        <View style={styles.buttonSpacing} />
        <Button title="View Projects" onPress={navigateToProjectsList} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: -50, // Adjust if needed to center content vertically
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Set background color if desired
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 24,
    borderRadius: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    width: '80%',
  },
  buttonSpacing: {
    height: 12, // Space between buttons
  },
});
