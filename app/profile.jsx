import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTrackingByParticipant } from '../api/tracking-crud-commands'; // Adjust the path as needed

export default function Profile() {
  const [username, setUsername] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [participantData, setParticipantData] = useState([]);
  const [participantProjectsCount, setParticipantProjectsCount] = useState(0);

  useEffect(() => {
    // Load saved data when component mounts
    const loadProfileData = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem('username');
        const savedImageUri = await AsyncStorage.getItem('imageUri');

        if (savedUsername) setUsername(savedUsername);
        if (savedImageUri) setImageUri(savedImageUri);

        if (savedUsername) {
          // Fetch participant data from Tracking API
          await fetchParticipantData(savedUsername);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, []);

  const fetchParticipantData = async (participantUsername) => {
    try {
      const trackingData = await getTrackingByParticipant(participantUsername);
      setParticipantData(trackingData);

      // Calculate the number of unique projects the participant has participated in
      const uniqueProjects = new Set(trackingData.map((item) => item.project_id));
      setParticipantProjectsCount(uniqueProjects.size);
    } catch (error) {
      console.error('Error fetching participant data:', error);
    }
  };

  const saveProfileData = async () => {
    try {
      if (!username) {
        Alert.alert('Validation Error', 'Please enter a username.');
        return;
      }

      await AsyncStorage.setItem('username', username);
      if (imageUri) {
        await AsyncStorage.setItem('imageUri', imageUri);
      } else {
        await AsyncStorage.removeItem('imageUri');
      }

      Alert.alert('Success', 'Profile data saved.');

      // Fetch participant data after saving
      await fetchParticipantData(username);
    } catch (error) {
      console.error('Error saving profile data:', error);
      Alert.alert('Error', 'Failed to save profile data.');
    }
  };

  const pickImage = async () => {
    // Request permission to access media library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const deleteProfileData = async () => {
    // Confirm with the user before deleting
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account information? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove data from AsyncStorage
              await AsyncStorage.removeItem('username');
              await AsyncStorage.removeItem('imageUri');

              // Reset state variables
              setUsername('');
              setImageUri(null);
              setParticipantData([]);
              setParticipantProjectsCount(0);

              Alert.alert('Account Deleted', 'Your account information has been deleted.');
            } catch (error) {
              console.error('Error deleting profile data:', error);
              Alert.alert('Error', 'Failed to delete account information.');
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: -50,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    textAlign: 'center',
  },
  input: {
    width: '80%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  deleteButtonContainer: {
    marginTop: 16,
  },
  participantDataContainer: {
    marginTop: 24,
  },
  participantDataText: {
    fontSize: 16,
    color: '#555',
  },
});
