import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

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
      <Text style={styles.title}>About Story Path</Text>

      {/* Description of the app */}
      <Text style={styles.description}>
        Welcome to Story Path, your companion for exploring unique projects and
        tracking your journey. Our app allows you to dive deep into project
        details, monitor your progress, and stay informed with the latest
        updates. Created with React Native and Expo, Story Path is optimized for
        a seamless experience on any device.
      </Text>

      {/* Additional section to introduce the app’s purpose */}
      <Text style={styles.highlightText}>
        Our Mission: Bringing stories to life, one project at a time.
      </Text>

      {/* Button to navigate back to the previous screen */}
      <TouchableOpacity onPress={() => router.back()} style={styles.button}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * styles defines the styling for the About component.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Enables flex layout
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
    padding: 30, // Adds padding around the container
  },
  title: {
    fontSize: 28, // Sets the font size for the title
    fontWeight: "700", // Makes the title text bold
    color: "#333", // Darker color for better contrast
    marginBottom: 20, // Adds margin below the title
    textAlign: "center", // Centers the title
  },
  description: {
    fontSize: 18, // Sets the font size for the description
    color: "#555", // Sets the text color for the description
    textAlign: "center", // Centers the text
    lineHeight: 26, // Adds line spacing for readability
    marginBottom: 30, // Adds margin below the description
  },
  highlightText: {
    fontSize: 16, // Font size for the highlighted text
    color: "#1a73e8", // Accent color
    fontWeight: "500", // Semi-bold font weight for emphasis
    textAlign: "center", // Centers the text
    marginBottom: 40, // Adds margin below the highlight text
  },
  button: {
    backgroundColor: "#1a73e8", // Button background color
    paddingVertical: 12, // Vertical padding for button
    paddingHorizontal: 24, // Horizontal padding for button
    borderRadius: 8, // Rounded corners for the button
    alignItems: "center", // Centers text inside the button
  },
  buttonText: {
    color: "#fff", // White text color for the button
    fontSize: 16, // Sets font size for button text
    fontWeight: "bold", // Bold font for button text
  },
});
