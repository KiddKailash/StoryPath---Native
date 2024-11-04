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
  getParticipantCountByLocation,
} from "../../api/tracking-crud-commands";

// Define custom CSS for WebView content
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

// Utility function to inject custom CSS into HTML content displayed in WebView
const injectCSS = (htmlContent) => {
  // Check if <head> tag exists; if so, insert CSS within it
  if (htmlContent.includes("<head>")) {
    return htmlContent.replace("<head>", `<head>${customCSS}`);
  } else {
    // If <head> is missing, create one and add CSS within
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

/**
 * HomeScreen component displays project details and dynamically updates project
 * score and visited locations based on the user's physical location.
 *
 * @returns {JSX.Element} The rendered HomeScreen component.
 */
export default function HomeScreen() {
  const { projectId } = useLocalSearchParams(); // Retrieve projectId from navigation params

  const [project, setProject] = useState(null); // Holds the project data
  const [locations, setLocations] = useState([]); // Stores all project locations
  const [tracking, setTracking] = useState([]); // Tracks user's progress through project
  const [loading, setLoading] = useState(true); // Controls loading state
  const [refreshing, setRefreshing] = useState(false); // Manages refresh state
  const [error, setError] = useState(null); // Holds error messages if data fetch fails
  const [visitedLocations, setVisitedLocations] = useState([]); // List of visited location IDs
  const [visitedLocationsData, setVisitedLocationsData] = useState([]); // Details of visited locations
  const [totalScore, setTotalScore] = useState(0); // Holds user's total score
  const [maxScore, setMaxScore] = useState(0); // Holds max possible score
  const [currentLocationContent, setCurrentLocationContent] = useState(""); // Content of current location
  const [selectedLocationContent, setSelectedLocationContent] = useState(null); // Content for selected location
  const [modalVisible, setModalVisible] = useState(false); // Manages modal visibility
  const [locationParticipantCounts, setLocationParticipantCounts] = useState(
    {}
  );

  // Function to fetch data from the API and AsyncStorage
  const fetchData = useCallback(async () => {
    setLoading(true); // Begin loading state
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest"; // Retrieve username or use "guest"
      const [projectData, locationsData, trackingData] = await Promise.all([
        getProjectById(projectId), // Fetch project data
        getLocationsByProjectID(projectId), // Fetch all locations for project
        getTrackingByParticipant(participant_username), // Fetch participant tracking data
      ]);

      if (projectData.length === 0) {
        throw new Error("Project not found.");
      }

      setProject(projectData[0]); // Store first project data entry
      setLocations(locationsData); // Store all location data
      setTracking(trackingData); // Store tracking data

      // Calculate max possible score by summing score_points for each location
      const totalMaxScore = locationsData.reduce(
        (sum, loc) => sum + (loc.score_points || 0),
        0
      );
      setMaxScore(totalMaxScore); // Set maximum score

      // Filter tracking data to include only entries for the current project
      const projectTrackingData = trackingData.filter(
        (entry) => entry.project_id === parseInt(projectId, 10)
      );

      // Map visited location IDs from tracking data
      const visitedLocationIds = projectTrackingData.map(
        (entry) => entry.location_id
      );
      setVisitedLocations(visitedLocationIds); // Store visited location IDs

      // Calculate total score based on tracked points
      const totalScoreFromTracking = projectTrackingData.reduce(
        (sum, entry) => {
          return sum + (entry.points || 0);
        },
        0
      );
      setTotalScore(totalScoreFromTracking); // Set total score

      // Populate visitedLocationsData array with details of each visited location
      const visitedData = locationsData.filter((loc) =>
        visitedLocationIds.includes(loc.id)
      );
      setVisitedLocationsData(visitedData); // Store visited locations data

      // Fetch participant counts for each location
      const counts = {};
      await Promise.all(
        locationsData.map(async (location) => {
          const count = await getParticipantCountByLocation(location.id);
          counts[location.id] = count;
        })
      );
      setLocationParticipantCounts(counts);
    } catch (err) {
      setError(err.message || "Error fetching data."); // Set error message
    } finally {
      setLoading(false); // End loading state
      setRefreshing(false); // End refreshing state
    }
  }, [projectId]);

  // Re-fetch data when the screen is focused, ensuring fresh data on return
  useFocusEffect(
    useCallback(() => {
      fetchData(); // Fetch data on focus
    }, [fetchData])
  );

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle pull-to-refresh event to reload data
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Set refreshing state
    fetchData(); // Re-fetch data
  }, [fetchData]);

  // Track user location in real-time and update visited locations
  useEffect(() => {
    let locationSubscription = null;
    const checkLocationPermissionAndStartTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission to access location was denied");
        return;
      }

      // Begin watching position changes if location access is granted
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High, // Set high accuracy
          distanceInterval: 10, // Trigger update every 10 meters
          timeInterval: 5000, // Trigger update every 5 seconds
        },
        (location) => {
          handleLocationUpdate(location.coords); // Process location update
        }
      );
    };

    checkLocationPermissionAndStartTracking();

    // Remove location tracking when component is unmounted
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locations, visitedLocations]);

  /**
   * Handle updates to the user's location. Check if the user is within a defined
   * radius of any location and mark the location as visited if they are.
   *
   * @param {Object} userCoords - The user's current coordinates.
   */
  const handleLocationUpdate = async (userCoords) => {
    const radius = 50; // Define radius in meters to determine proximity
    for (const loc of locations) {
      if (visitedLocations.includes(loc.id)) {
        continue; // Skip locations already visited
      }

      // Parse latitude and longitude from location string
      const [latStr, lonStr] = loc.location_position
        .replace("(", "")
        .replace(")", "")
        .split(",");
      const locationCoords = {
        latitude: parseFloat(latStr),
        longitude: parseFloat(lonStr),
      };

      // Calculate distance between user and location
      const distance = getDistance(
        { latitude: userCoords.latitude, longitude: userCoords.longitude },
        locationCoords
      );

      // If within radius, mark location as visited
      if (distance <= radius) {
        await sendTrackingData(projectId, loc.id, loc.score_points); // Send tracking data to server
        await fetchData(); // Refresh data to update score and visited locations
        setCurrentLocationContent(loc.location_content); // Set content for modal display
        setModalVisible(true); // Open modal to show location content
      }
    }
  };

  /**
   * Send tracking data for a specific location to track the user's progress.
   *
   * @param {number} projectID - ID of the project.
   * @param {number} locationID - ID of the location.
   * @param {number} score_points - Points scored for visiting the location.
   */
  const sendTrackingData = async (projectID, locationID, score_points) => {
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";
      const username = "s4582256"; // Replace with actual username

      const projectIDInt = parseInt(projectID, 10); // Ensure ID is integer
      const locationIDInt = parseInt(locationID, 10); // Ensure ID is integer

      const trackingData = {
        project_id: projectIDInt,
        location_id: locationIDInt,
        points: score_points,
        username: username,
        participant_username: participant_username,
      };

      // Check if tracking entry exists; only create new entry if none found
      const existingTrackingEntries = await getTrackingEntry(
        participant_username,
        projectIDInt,
        locationIDInt
      );

      if (existingTrackingEntries.length === 0) {
        await createTracking(trackingData); // Create tracking entry
      }
    } catch (error) {
      console.error("Error sending tracking data:", error);
    }
  };

  const handleLocationPress = (content) => {
    setSelectedLocationContent(content); // Set content for selected location
    setModalVisible(true); // Open modal to show content
  };

  const closeModal = () => {
    setModalVisible(false); // Close modal
    setCurrentLocationContent(""); // Clear current location content
    setSelectedLocationContent(null); // Clear selected location content
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
                  <Text>
                    Unlocked by {locationParticipantCounts[loc.id] || 0} user(s)
                  </Text>
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: injectCSS(loc.location_content) }}
                    style={styles.webView}
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
      {modalVisible && (currentLocationContent || selectedLocationContent) && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <WebView
              originWhitelist={["*"]}
              source={{
                html: injectCSS(
                  selectedLocationContent || currentLocationContent
                ),
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
