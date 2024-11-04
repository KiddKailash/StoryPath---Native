// about.jsx

import { View, Text, Button, StyleSheet } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

/**
 * About component displays information about the application.
 *
 * @returns {JSX.Element} The rendered About component.
 */
export default function About() {
  const router = useRouter(); // Hook to access the router for navigation

  return (
    <View style={styles.container}>
      {/* Title of the About page */}
      <Text style={styles.title}>About Page</Text>
      
      {/* Description of the app */}
      <Text style={styles.description}>
        This app is designed to provide users with insights into various projects,
        allowing them to explore details, track progress, and stay updated with the
        latest information. Built with React Native and Expo, it’s optimized for a
        smooth user experience across multiple platforms.
      </Text>
      
      {/* Button to navigate back to the previous screen */}
      <Button onPress={() => router.back()} title='Go Back' />
    </View>
  );
}

/**
 * styles defines the styling for the About component.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Enables flex layout
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
    padding: 20, // Adds padding around the container
    backgroundColor: '#f5f5f5', // Sets the background color
  },
  title: {
    fontSize: 24, // Sets the font size for the title
    fontWeight: 'bold', // Makes the title text bold
    marginBottom: 10, // Adds margin below the title
  },
  description: {
    fontSize: 16, // Sets the font size for the description
    color: '#555', // Sets the text color for the description
    textAlign: 'center', // Centers the text
    marginBottom: 20, // Adds margin below the description
  },
});
