import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Button,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import { getProjectById } from "../../api/project-crud-commands";
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import {
  createTracking,
  getTrackingByParticipant,
  getTrackingEntry,
} from "../../api/tracking-crud-commands";

// Define your custom CSS
const customCSS = `
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      padding: 20px 50px;
      background-color: #fff;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #1a73e8;
    }
    p {
      font-size: 40px;
      line-height: 1.5;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    a {
      color: #1a73e8;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    /* Additional styles to match your app's theme */
    /* Example: Button styling */
    .custom-button {
      display: inline-block;
      padding: 10px 20px;
      margin: 10px 0;
      background-color: #1a73e8;
      color: #fff;
      border-radius: 4px;
      text-align: center;
      cursor: pointer;
    }
    .custom-button:hover {
      background-color: #1669c1;
    }
  </style>
`;

// Utility function to inject CSS into HTML content
const injectCSS = (htmlContent) => {
  // Check if the HTML already contains a <head> tag
  if (htmlContent.includes("<head>")) {
    // Insert the custom CSS within the existing <head> tag
    return htmlContent.replace("<head>", `<head>${customCSS}`);
  } else {
    // If there's no <head>, add one with the custom CSS
    return `
      <head>
        ${customCSS}
      </head>
      <body>
        ${htmlContent}
      </body>
    `;
  }
};

export default function HomeScreen() {
  const { projectId } = useLocalSearchParams();
  console.log("HomeScreen projectId:", projectId);

  const [project, setProject] = useState(null);
  const [locations, setLocations] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [visitedLocations, setVisitedLocations] = useState([]);
  const [visitedLocationsData, setVisitedLocationsData] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentLocationContent, setCurrentLocationContent] = useState("");
  const [selectedLocationContent, setSelectedLocationContent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";
      const [projectData, locationsData, trackingData] = await Promise.all([
        getProjectById(projectId),
        getLocationsByProjectID(projectId),
        getTrackingByParticipant(participant_username),
      ]);

      if (projectData.length === 0) {
        throw new Error("Project not found.");
      }

      setProject(projectData[0]);
      setLocations(locationsData);
      setTracking(trackingData);

      console.log("Tracking Data:", JSON.stringify(trackingData, null, 2));

      const totalMaxScore = locationsData.reduce(
        (sum, loc) => sum + (loc.score_points || 0),
        0
      );
      setMaxScore(totalMaxScore);

      // Filter tracking data for the current project
      const projectTrackingData = trackingData.filter(
        (entry) => entry.project_id === parseInt(projectId, 10)
      );

      // Calculate total score and visited locations based on tracking data
      const visitedLocationIds = projectTrackingData.map(
        (entry) => entry.location_id
      );

      setVisitedLocations(visitedLocationIds);

      const totalScoreFromTracking = projectTrackingData.reduce((sum, entry) => {
        return sum + (entry.points || 0);
      }, 0);

      setTotalScore(totalScoreFromTracking);

      // Populate visitedLocationsData with location details
      const visitedData = locationsData.filter((loc) =>
        visitedLocationIds.includes(loc.id)
      );
      setVisitedLocationsData(visitedData);
    } catch (err) {
      setError(err.message || "Error fetching data.");
      console.error("Error fetching project or locations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  // Refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Location tracking
  useEffect(() => {
    let locationSubscription = null;
    const checkLocationPermissionAndStartTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access location was denied");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000, // Update every 5 seconds
        },
        (location) => {
          handleLocationUpdate(location.coords);
        }
      );
    };

    checkLocationPermissionAndStartTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locations, visitedLocations]);

  const handleLocationUpdate = async (userCoords) => {
    const radius = 50; // Radius in meters to consider as 'at location'
    for (const loc of locations) {
      if (visitedLocations.includes(loc.id)) {
        continue; // Skip if already visited
      }

      const [latStr, lonStr] = loc.location_position
        .replace("(", "")
        .replace(")", "")
        .split(",");
      const locationCoords = {
        latitude: parseFloat(latStr),
        longitude: parseFloat(lonStr),
      };

      const distance = getDistance(
        { latitude: userCoords.latitude, longitude: userCoords.longitude },
        locationCoords
      );

      if (distance <= radius) {
        console.log(`User has arrived at location ${loc.location_name}`);

        // Send tracking data
        await sendTrackingData(projectId, loc.id, loc.score_points);

        // Refresh data to update score and visited locations
        await fetchData();

        // Display location content
        setCurrentLocationContent(loc.location_content);
        setModalVisible(true);
      }
    }
  };

  const sendTrackingData = async (projectID, locationID, score_points) => {
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";
      const username = "s4582256"; // Replace with your actual username

      // Ensure IDs are integers
      const projectIDInt = parseInt(projectID, 10);
      const locationIDInt = parseInt(locationID, 10);

      // Define tracking data structure
      const trackingData = {
        project_id: projectIDInt,
        location_id: locationIDInt,
        points: score_points,
        username: username,
        participant_username: participant_username,
      };

      // Fetch existing tracking entry for the project, location, and participant
      const existingTrackingEntries = await getTrackingEntry(
        participant_username,
        projectIDInt,
        locationIDInt
      );

      // Only create a new tracking entry if none exists
      if (existingTrackingEntries.length === 0) {
        console.log("Creating new tracking data entry:", trackingData);
        await createTracking(trackingData);
      } else {
        console.log("Tracking entry already exists, skipping creation.");
      }
    } catch (error) {
      console.error("Error sending tracking data:", error);
    }
  };

  const handleLocationPress = (content) => {
    setSelectedLocationContent(content);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentLocationContent("");
    setSelectedLocationContent(null);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  /**
   * Renders the content for the homescreen based on the project's settings.
   *
   * @return {JSX.Element|null} - The homescreen content or a list of all locations.
   */
  const renderHomescreenContent = () => {
    if (project?.homescreen_display === "display_initial_clue") {
      return (
        <View style={styles.homescreenContent}>
          <Text style={styles.sectionTitle}>Initial Clue</Text>
          <Text style={styles.sectionContent}>{project.initial_clue}</Text>
        </View>
      );
    } else if (project?.homescreen_display === "display_all_locations") {
      return (
        <View style={styles.homescreenContent}>
          <Text style={styles.sectionTitle}>All Locations</Text>
          {locations.map((location) => (
            <View key={location.id} style={styles.locationItem}>
              <Text style={styles.locationName}>{location.location_name}</Text>
              <Text style={styles.locationClue}>
                {location.clue || "No clue provided"}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Project Information */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle}>
            {project?.title || "Untitled Project"}
          </Text>
          <Text style={styles.projectInstructions}>
            {project?.instructions || "No instructions provided."}
          </Text>
        </View>

        {/* Conditional Homescreen Content */}
        {renderHomescreenContent()}

        {/* Score and Locations Visited */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {totalScore}/{maxScore}
          </Text>
          <Text style={styles.scoreText}>
            Locations Visited: {visitedLocations.length}/{locations.length}
          </Text>
        </View>

        {/* Display location_content for each visited location */}
        {visitedLocationsData.length > 0 && (
          <View>
            <Text style={styles.visitedLocationsTitle}>Visited Locations</Text>
            {visitedLocationsData.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                onPress={() => handleLocationPress(loc.location_content)}
              >
                <View style={styles.webViewContainer}>
                  <Text style={styles.locationName}>{loc.location_name}</Text>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: injectCSS(loc.location_content) }}
                    style={styles.webView}
                    // Disable interaction within the small WebView to prevent accidental taps
                    scrollEnabled={false}
                    pointerEvents="none"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Loading Modal */}
      {loading && (
        <Modal transparent={true} animationType="none">
          <View style={styles.loadingContainer}>
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* Content Modal */}
      {(modalVisible && (currentLocationContent || selectedLocationContent)) && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <WebView
              originWhitelist={['*']}
              source={{
                html:
                  injectCSS(selectedLocationContent || currentLocationContent),
              }}
              style={{ flex: 1 }}
            />
            <Button title="Close" onPress={closeModal} />
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  projectInfo: {
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  projectInstructions: {
    fontSize: 16,
    color: "#555",
  },
  scoreContainer: {
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 16,
    marginBottom: 4,
  },
  homescreenContent: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    marginBottom: 4,
  },
  locationItem: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  locationClue: {
    fontSize: 14,
    color: "#666",
  },
  visitedLocationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  webViewContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  webView: {
    height: 200,
  },
  loadingContainer: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingWrapper: {
    backgroundColor: "#444",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
  },
});
