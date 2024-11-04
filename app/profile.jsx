import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTrackingByParticipant } from "../api/tracking-crud-commands"; // Adjust the path as needed

/**
 * Profile component allows users to view and edit their profile information,
 * including username and profile image. It also displays the number of projects
 * the user has participated in.
 *
 * @returns {JSX.Element} The rendered Profile component.
 */
export default function Profile() {
  const [username, setUsername] = useState(""); // State to hold the username
  const [imageUri, setImageUri] = useState(null); // State to hold the profile image URI
  const [participantData, setParticipantData] = useState([]); // State to hold participant tracking data
  const [participantProjectsCount, setParticipantProjectsCount] = useState(0); // State to hold the count of unique projects

  useEffect(() => {
    // Load saved data when component mounts
    const loadProfileData = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("username"); // Retrieve saved username
        const savedImageUri = await AsyncStorage.getItem("imageUri"); // Retrieve saved image URI

        if (savedUsername) setUsername(savedUsername); // Set username state if found
        if (savedImageUri) setImageUri(savedImageUri); // Set imageUri state if found

        if (savedUsername) {
          // Fetch participant data if username exists
          await fetchParticipantData(savedUsername);
        }
      } catch (error) {
        console.error("Error loading profile data:", error); // Log any errors
      }
    };

    loadProfileData(); // Invoke the function to load data
  }, []);

  /**
   * Fetches participant tracking data based on the provided username.
   *
   * @param {string} participantUsername - The username of the participant.
   */
  const fetchParticipantData = async (participantUsername) => {
    try {
      const trackingData = await getTrackingByParticipant(participantUsername); // Fetch tracking data
      setParticipantData(trackingData); // Update participant data state

      // Calculate the number of unique projects the participant has participated in
      const uniqueProjects = new Set(
        trackingData.map((item) => item.project_id)
      );
      setParticipantProjectsCount(uniqueProjects.size); // Update projects count state
    } catch (error) {
      console.error("Error fetching participant data:", error); // Log any errors
    }
  };

  /**
   * Saves the profile data to AsyncStorage.
   */
  const saveProfileData = async () => {
    try {
      if (!username) {
        // Alert the user if username is not provided
        Alert.alert("Validation Error", "Please enter a username.");
        return;
      }

      await AsyncStorage.setItem("username", username); // Save username
      if (imageUri) {
        await AsyncStorage.setItem("imageUri", imageUri); // Save image URI if available
      } else {
        await AsyncStorage.removeItem("imageUri"); // Remove image URI if not available
      }

      Alert.alert("Success", "Profile data saved."); // Notify the user of success

      // Fetch participant data after saving
      await fetchParticipantData(username);
    } catch (error) {
      console.error("Error saving profile data:", error); // Log any errors
      Alert.alert("Error", "Failed to save profile data."); // Notify the user of failure
    }
  };

  /**
   * Opens the image picker for the user to select a profile image.
   */
  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      // Alert the user if permission is denied
      Alert.alert(
        "Permission Denied",
        "Permission to access media library is required."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Allow only images
        allowsEditing: true, // Allow image editing
        aspect: [1, 1], // Maintain square aspect ratio
        quality: 1, // Set image quality to maximum
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri); // Set the selected image URI
      }
    } catch (error) {
      console.error("Error picking image:", error); // Log any errors
    }
  };

  /**
   * Deletes the user's profile data after confirmation.
   */
  const deleteProfileData = async () => {
    // Confirm with the user before deleting
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account information? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" }, // Option to cancel
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove data from AsyncStorage
              await AsyncStorage.removeItem("username");
              await AsyncStorage.removeItem("imageUri");

              // Reset state variables
              setUsername("");
              setImageUri(null);
              setParticipantData([]);
              setParticipantProjectsCount(0);

              Alert.alert(
                "Account Deleted",
                "Your account information has been deleted."
              ); // Notify the user
            } catch (error) {
              console.error("Error deleting profile data:", error); // Log any errors
              Alert.alert("Error", "Failed to delete account information."); // Notify the user of failure
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Profile Image */}
      <TouchableOpacity onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>Tap to select image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Username Input */}
      <TextInput
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      {/* Save Button */}
      <Button title="Save Profile" onPress={saveProfileData} />

      {/* Delete Account Button */}
      {username ? (
        <View style={styles.deleteButtonContainer}>
          <Button
            title="Delete Account"
            onPress={deleteProfileData}
            color="red"
          />
        </View>
      ) : null}

      {/* Display Participant Data */}
      {participantProjectsCount > 0 && (
        <View style={styles.participantDataContainer}>
          <Text style={styles.participantDataText}>
            You have participated in {participantProjectsCount} project(s).
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * styles defines the styling for the Profile component.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Enables flex layout to fill the screen
    padding: 16, // Adds padding around the container
    marginTop: -50, // Adjusts the top margin to center content vertically
    alignItems: "center", // Centers content horizontally
    backgroundColor: "#fff", // Sets the background color to white
  },
  title: {
    fontSize: 28, // Sets the font size for the title
    fontWeight: "bold", // Makes the title text bold
    marginBottom: 24, // Adds margin below the title
    textAlign: "center", // Centers the text horizontally
  },
  profileImage: {
    width: 150, // Sets the width of the profile image
    height: 150, // Sets the height of the profile image
    borderRadius: 75, // Makes the image circular
    marginBottom: 24, // Adds margin below the image
  },
  placeholderImage: {
    width: 150, // Sets the width of the placeholder
    height: 150, // Sets the height of the placeholder
    borderRadius: 75, // Makes the placeholder circular
    backgroundColor: "#f0f0f0", // Sets the background color of the placeholder
    marginBottom: 24, // Adds margin below the placeholder
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
  },
  placeholderText: {
    color: "#888", // Sets the text color for the placeholder
    textAlign: "center", // Centers the text
  },
  input: {
    width: "80%", // Sets the width of the input field to 80% of the parent
    height: 40, // Sets the height of the input field
    borderColor: "#ccc", // Sets the border color
    borderWidth: 1, // Sets the border width
    paddingHorizontal: 8, // Adds horizontal padding inside the input
    marginBottom: 16, // Adds margin below the input field
  },
  deleteButtonContainer: {
    marginTop: 16, // Adds margin above the delete button
  },
  participantDataContainer: {
    marginTop: 24, // Adds margin above the participant data
  },
  participantDataText: {
    fontSize: 16, // Sets the font size for the participant data text
    color: "#555", // Sets the text color to a dark gray
  },
});
