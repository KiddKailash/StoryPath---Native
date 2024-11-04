import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * Index component serves as the home screen of the application.
 * It displays the app icon, title, a welcome message, and navigation buttons
 * to the Profile and Projects List screens.
 *
 * @returns {JSX.Element} The rendered Index component.
 */
export default function Index() {
  const router = useRouter(); // Hook to access the router for navigation

  /**
   * navigateToProfile navigates the user to the Profile screen.
   */
  const navigateToProfile = () => {
    router.push('/profile'); // Navigate to the Profile screen
  };

  /**
   * navigateToProjectsList navigates the user to the Projects List screen.
   */
  const navigateToProjectsList = () => {
    router.push('/projectsList'); // Navigate to the Projects List screen
  };

  return (
    <View style={styles.container}>
      {/* Display the application icon */}
      <Image
        source={require('../assets/images/storypath-icon.png')} // Path to the icon image
        style={styles.image} // Apply styling to the image
        resizeMode="contain" // Ensure the image scales uniformly
      />

      {/* Display the application title */}
      <Text style={styles.title}>Story Path</Text>

      {/* Display the welcome message */}
      <Text style={styles.message}>
        Explore amazing projects and create your own stories!
      </Text>

      {/* Container for navigation buttons */}
      <View style={styles.buttonContainer}>
        {/* Button to navigate to the Profile screen */}
        <Button title="Go to Profile" onPress={navigateToProfile} />

        {/* Spacer between buttons */}
        <View style={styles.buttonSpacing} />

        {/* Button to navigate to the Projects List screen */}
        <Button title="View Projects" onPress={navigateToProjectsList} />
      </View>
    </View>
  );
}

/**
 * styles defines the styling for the Index component.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Enables flex layout to fill the screen
    padding: 16, // Adds padding around the container
    marginTop: -50, // Adjusts the top margin to center content vertically
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
    backgroundColor: '#fff', // Sets the background color to white
  },
  image: {
    width: 200, // Sets the width of the image
    height: 200, // Sets the height of the image
    marginBottom: 24, // Adds margin below the image
    borderRadius: 30, // Rounds the corners of the image
  },
  title: {
    fontSize: 28, // Sets the font size for the title
    fontWeight: 'bold', // Makes the title text bold
    marginBottom: 12, // Adds margin below the title
    textAlign: 'center', // Centers the text horizontally
  },
  message: {
    fontSize: 16, // Sets the font size for the message
    marginBottom: 24, // Adds margin below the message
    textAlign: 'center', // Centers the text horizontally
    color: '#555', // Sets the text color to a dark gray
  },
  buttonContainer: {
    width: '80%', // Sets the width of the button container to 80% of the parent
  },
  buttonSpacing: {
    height: 12, // Adds vertical space between the buttons
  },
});
