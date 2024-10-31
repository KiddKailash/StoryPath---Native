import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  Button,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getProjectById } from "../../api/project-crud-commands";
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import { createTracking } from "../../api/tracking-crud-commands";

export default function HomeScreen() {
  const { projectId } = useLocalSearchParams();
  console.log("HomeScreen projectId:", projectId);

  if (!projectId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid project ID.</Text>
      </View>
    );
  }

  const [project, setProject] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitedLocations, setVisitedLocations] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentLocationContent, setCurrentLocationContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch project and locations data
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [projectData, locationsData] = await Promise.all([
          getProjectById(projectId),
          getLocationsByProjectID(projectId),
        ]);

        if (isMounted) {
          setProject(projectData[0]);
          setLocations(locationsData);

          const totalMaxScore = locationsData.reduce(
            (sum, loc) => sum + (loc.score_points || 0),
            0
          );
          setMaxScore(totalMaxScore);

          setLoading(false);
          console.log("Data loaded successfully:", { projectData, locationsData });
        }
      } catch (err) {
        setError("Error fetching data.");
        console.error("Error fetching project or locations:", err);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Location tracking
  useEffect(() => {
    let locationSubscription = null;
    const checkLocationPermissionAndStartTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError("Permission to access location was denied");
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000,   // Update every 5 seconds
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
    // Check if user is near any location
    const radius = 50; // Radius in meters to consider as 'at location'
    for (const loc of locations) {
      if (visitedLocations.includes(loc.id)) {
        continue; // Skip if already visited
      }

      const [latStr, lonStr] = loc.location_position.replace("(", "").replace(")", "").split(",");
      const locationCoords = {
        latitude: parseFloat(latStr),
        longitude: parseFloat(lonStr),
      };

      const distance = getDistance(
        { latitude: userCoords.latitude, longitude: userCoords.longitude },
        locationCoords
      );

      if (distance <= radius) {
        // User is at the location
        console.log(`User has arrived at location ${loc.location_name}`);
        // Update visited locations and score
        setVisitedLocations((prev) => [...prev, loc.id]);
        setTotalScore((prev) => prev + (loc.score_points || 0));
        // Display location content
        setCurrentLocationContent(loc.location_content);
        setModalVisible(true);
        // Send tracking data
        await sendTrackingData(projectId, loc.id, loc.score_points);
      }
    }
  };

  const sendTrackingData = async (projectID, locationID, score_points) => {
    try {
      const participant_username = await AsyncStorage.getItem("username") || "guest";
      const username = "s4582256"; // Replace with your actual username

      const trackingData = {
        project_id: projectID,
        location_id: locationID,
        points: score_points,
        username: username,
        participant_username: participant_username,
      };

      console.log("Sending tracking data:", trackingData);
      await createTracking(trackingData);
    } catch (error) {
      console.error("Error sending tracking data:", error);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setCurrentLocationContent("");
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

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
            <Text key={location.id} style={styles.sectionContent}>
              {`- ${location.location_name}`}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Project Title & Instructions */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle}>
            {project?.title || "Untitled Project"}
          </Text>
          <Text style={styles.projectInstructions}>
            {project?.instructions || "No instructions provided."}
          </Text>
        </View>

        {/* Initial Clue or All Locations */}
        {renderHomescreenContent()}

        {/* Score and Location Count */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {totalScore}/{maxScore}
          </Text>
          <Text style={styles.scoreText}>
            Locations Visited: {visitedLocations.length}/{locations.length}
          </Text>
        </View>
      </ScrollView>

      {/* Loading Screen */}
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

      {/* Location Content Modal */}
      {modalVisible && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <WebView source={{ html: currentLocationContent }} style={{ flex: 1 }} />
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});
