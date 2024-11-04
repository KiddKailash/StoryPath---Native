import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

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
        <TouchableOpacity style={styles.button} onPress={navigateToProfile}>
          <Text style={styles.buttonText}>Go to Profile</Text>
        </TouchableOpacity>

        {/* Spacer between buttons */}
        <View style={styles.buttonSpacing} />

        {/* Button to navigate to the Projects List screen */}
        <TouchableOpacity style={styles.button} onPress={navigateToProjectsList}>
          <Text style={styles.buttonText}>View Projects</Text>
        </TouchableOpacity>
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
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
  },
  image: {
    width: 180, // Sets the width of the image
    height: 180, // Sets the height of the image
    marginBottom: 30, // Adds margin below the image
    borderRadius: 15, // Rounds the corners of the image
    borderWidth: 2, // Adds border around the image
    borderColor: '#1a73e8', // Border color for accent
  },
  title: {
    fontSize: 32, // Sets the font size for the title
    fontWeight: '600', // Makes the title text bold
    color: '#333', // Dark gray color for better contrast
    marginBottom: 20, // Adds margin below the title
    textAlign: 'center', // Centers the text horizontally
  },
  message: {
    fontSize: 18, // Sets the font size for the message
    marginBottom: 40, // Adds margin below the message
    textAlign: 'center', // Centers the text horizontally
    color: '#666', // Sets the text color to a medium gray
  },
  buttonContainer: {
    width: '80%', // Sets the width of the button container to 80% of the parent
  },
  button: {
    backgroundColor: '#1a73e8', // Sets button background color
    paddingVertical: 12, // Vertical padding for button
    borderRadius: 8, // Rounded corners for the button
    alignItems: 'center', // Centers text inside the button
  },
  buttonText: {
    color: '#fff', // White text color for the button
    fontSize: 16, // Sets font size for button text
    fontWeight: 'bold', // Bold font for button text
  },
  buttonSpacing: {
    height: 16, // Adds vertical space between the buttons
  },
});
