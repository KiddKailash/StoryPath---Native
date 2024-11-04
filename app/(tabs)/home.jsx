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
  Alert,
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
 * Helper functions to manage proximity and QR scan flags in AsyncStorage
 */
const setProximityFlag = async (locationID) => {
  try {
    await AsyncStorage.setItem(`proximity_${locationID}`, "true");
  } catch (error) {
    console.error(`Error setting proximity flag for location ${locationID}:`, error);
  }
};

const checkProximityFlag = async (locationID) => {
  try {
    const value = await AsyncStorage.getItem(`proximity_${locationID}`);
    return value === "true";
  } catch (error) {
    console.error(`Error checking proximity flag for location ${locationID}:`, error);
    return false;
  }
};

const setQRScanFlag = async (locationID) => {
  try {
    await AsyncStorage.setItem(`qr_scanned_${locationID}`, "true");
  } catch (error) {
    console.error(`Error setting QR scan flag for location ${locationID}:`, error);
  }
};

const checkQRScanFlag = async (locationID) => {
  try {
    const value = await AsyncStorage.getItem(`qr_scanned_${locationID}`);
    return value === "true";
  } catch (error) {
    console.error(`Error checking QR scan flag for location ${locationID}:`, error);
    return false;
  }
};

const clearFlags = async (locationID) => {
  try {
    await AsyncStorage.removeItem(`proximity_${locationID}`);
    await AsyncStorage.removeItem(`qr_scanned_${locationID}`);
  } catch (error) {
    console.error(`Error clearing flags for location ${locationID}:`, error);
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

  // State variables
  const [project, setProject] = useState(null); // Holds the project data
  const [locations, setLocations] = useState([]); // Stores all project locations
  const [tracking, setTracking] = useState([]); // Tracks user's progress through project
  const [loading, setLoading] = useState(true); // Controls initial loading state
  const [refreshing, setRefreshing] = useState(false); // Manages pull-to-refresh state
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
  ); // Tracks the number of participants who have 'unlocked' a location

  /**
   * Function to fetch initial data: project details, locations, and tracking data.
   * This sets the initial loading state and handles errors.
   */
  const fetchInitialData = useCallback(async () => {
    setLoading(true); // Begin loading state
    setError(null); // Reset error state
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
      setRefreshing(false); // End refreshing state if it was a refresh
    }
  }, [projectId]);

  /**
   * Function to fetch only tracking data and participant counts.
   * This is used during location updates to refresh visited locations without affecting the loading state.
   */
  const fetchTrackingData = useCallback(async () => {
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";

      // Get tracking data for participant
      const trackingData = await getTrackingByParticipant(participant_username);
      console.log("Tracking Data:", JSON.stringify(trackingData, null, 2));

      // Filter tracking data for current project
      const projectTrackingData = trackingData.filter(
        (entry) => entry.project_id === parseInt(projectId, 10)
      );

      // Get IDs of visited locations
      const visitedLocationIds = projectTrackingData.map(
        (entry) => entry.location_id
      );
      setVisitedLocations(visitedLocationIds); // Update visited location IDs

      // Update visitedLocationsData with the latest tracking data
      const visitedData = locations.filter((loc) =>
        visitedLocationIds.includes(loc.id)
      );
      setVisitedLocationsData(visitedData);

      // Fetch updated participant counts for each location
      const counts = { ...locationParticipantCounts };
      await Promise.all(
        locations.map(async (location) => {
          const count = await getParticipantCountByLocation(location.id);
          counts[location.id] = count;
        })
      );
      setLocationParticipantCounts(counts);
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      // Optionally, you can set an error state or handle it as needed
    }
  }, [projectId, locations, locationParticipantCounts]);

  /**
   * useFocusEffect ensures that fetchInitialData is called each time the screen is focused.
   * This keeps the data up-to-date when returning to the screen.
   */
  useFocusEffect(
    useCallback(() => {
      fetchInitialData(); // Fetch initial data on focus
    }, [fetchInitialData])
  );

  /**
   * Initial data fetch when component mounts.
   */
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  /**
   * Refresh handler for pull-to-refresh.
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchInitialData(); // Re-fetch initial data on refresh
  }, [fetchInitialData]);

  /**
   * Watches user's location to update visited locations when nearby.
   * This runs independently of the initial loading state.
   */
  useEffect(() => {
    let locationSubscription = null;

    const watchUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Permission to access location was denied");
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High, // Set high accuracy
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 5000, // Update every 5 seconds
          },
          async (location) => {
            const userCoords = location.coords;
            console.log("Updated user location:", userCoords);

            const radius = 75; // Radius in meters for proximity check

            for (const loc of locations) {
              // Only process locations with 'Location Entry' or 'Location Entry and QR Code' triggers
              if (
                loc.location_trigger !== "Location Entry" &&
                loc.location_trigger !== "Location Entry and QR Code"
              ) {
                continue;
              }

              // Skip locations already visited
              if (visitedLocations.includes(loc.id)) {
                continue;
              }

              // Parse coordinates from location data
              const [latStr, lonStr] = loc.location_position
                .replace("(", "")
                .replace(")", "")
                .split(",")
                .map((coord) => coord.trim());
              const locationCoords = {
                latitude: parseFloat(latStr),
                longitude: parseFloat(lonStr),
              };

              // Calculate distance between user and location
              const distance = getDistance(
                {
                  latitude: userCoords.latitude,
                  longitude: userCoords.longitude,
                },
                locationCoords
              );

              console.log(
                `Distance to ${loc.location_name}: ${distance} meters`
              );

              // If user is within radius, handle based on location_trigger
              if (distance <= radius) {
                if (loc.location_trigger === "Location Entry") {
                  // For 'Location Entry', send tracking directly
                  console.log(
                    `User has arrived at location ${loc.location_name} (Location Entry)`
                  );
                  await sendTrackingData(projectId, loc.id, loc.score_points);
                  await fetchTrackingData();
                } else if (loc.location_trigger === "Location Entry and QR Code") {
                  // For 'Location Entry and QR Code', check if QR code has been scanned
                  const qrScanned = await checkQRScanFlag(loc.id);
                  if (qrScanned) {
                    console.log(
                      `User has arrived at location ${loc.location_name} (Location Entry and QR Code)`
                    );
                    await sendTrackingData(projectId, loc.id, loc.score_points);
                    await clearFlags(loc.id);
                    await fetchTrackingData();
                  } else {
                    // Set proximity flag
                    await setProximityFlag(loc.id);
                    console.log(
                      `Proximity flag set for location ${loc.location_name} (Location Entry and QR Code)`
                    );
                  }
                }
              }
            }
          }
        );
      } catch (error) {
        console.error("Error watching location:", error);
        setError("Error watching location");
      }
    };

    watchUserLocation();

    // Cleanup location subscription when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locations, visitedLocations, projectId, fetchTrackingData]);

  /**
   * Sends tracking data for a visited location.
   *
   * @param {string} projectID - The project ID.
   * @param {number} locationID - The location ID.
   * @param {number} score_points - The score points for the location.
   */
  const sendTrackingData = async (projectID, locationID, score_points) => {
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";
      const username = "s4582256"; // Replace with actual username

      // Ensure IDs are integers for API call
      const projectIDInt = parseInt(projectID, 10);
      const locationIDInt = parseInt(locationID, 10);

      // Construct tracking data payload
      const trackingData = {
        project_id: projectIDInt,
        location_id: locationIDInt,
        points: score_points,
        username: username,
        participant_username: participant_username,
      };

      // Check for existing tracking entry to avoid duplicates
      const existingTrackingEntries = await getTrackingEntry(
        participant_username,
        projectIDInt,
        locationIDInt
      );

      // Create tracking entry if it doesn't exist
      if (existingTrackingEntries.length === 0) {
        console.log("Creating new tracking data entry:", trackingData);
        await createTracking(trackingData);
      } else {
        console.log("Tracking entry already exists, skipping creation.");
      }
    } catch (error) {
      console.error("Error sending tracking data:", error);
      Alert.alert("Tracking Error", "Failed to record your visit. Please try again.");
    }
  };

  /**
   * Handles the press event on a visited location to display its content.
   *
   * @param {string} content - The HTML content of the location.
   */
  const handleLocationPress = (content) => {
    setSelectedLocationContent(content); // Set content for selected location
    setModalVisible(true); // Open modal to show content
  };

  /**
   * Closes the content modal and clears related states.
   */
  const closeModal = () => {
    setModalVisible(false); // Close modal
    setCurrentLocationContent(""); // Clear current location content
    setSelectedLocationContent(null); // Clear selected location content
  };

  /**
   * Renders error message if any error occurs.
   *
   * @return {JSX.Element} - Error message view.
   */
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  /**
   * Renders a loading indicator during the initial data fetch.
   *
   * @return {JSX.Element} - Loading view.
   */
  const renderLoading = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading...</Text>
    </View>
  );

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

  /**
   * Renders the main content of the HomeScreen, including project info, score, and visited locations.
   */
  const renderMainContent = () => (
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
  );

  /**
   * Renders a loading modal during the initial data fetch.
   *
   * @return {JSX.Element} - Loading view.
   */
  const renderLoadingModal = () => (
    <Modal transparent={true} animationType="none">
      <View style={styles.loadingContainer}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    </Modal>
  );

  /**
   * Renders the content modal displaying location details.
   */
  const renderContentModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      onRequestClose={closeModal}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <WebView
          originWhitelist={["*"]}
          source={{
            html: injectCSS(selectedLocationContent || currentLocationContent),
          }}
          style={{ flex: 1 }}
        />
        <Button title="Close" onPress={closeModal} />
      </SafeAreaView>
    </Modal>
  );

  // Render based on loading, error, or map display state
  if (error) {
    return renderError();
  }

  if (loading) {
    return renderLoading(); // Show loading modal only during initial data fetch
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      {renderMainContent()}

      {/* Loading Modal */}
      {loading && renderLoadingModal()}

      {/* Content Modal */}
      {modalVisible &&
        (currentLocationContent || selectedLocationContent) &&
        renderContentModal()}
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
    padding: 10, // Optional: add padding inside the container
    backgroundColor: "#f9f9f9", // Optional: background color for better visibility
  },
  webView: {
    height: 200,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  calloutContainer: {
    width: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: "#555",
  },
});
