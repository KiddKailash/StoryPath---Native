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
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getProjectById } from "../../api/project-crud-commands";
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import {
  createTracking,
  getTrackingByParticipant,
  getTrackingEntry
} from "../../api/tracking-crud-commands";

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
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [currentLocationContent, setCurrentLocationContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Wrap fetchData in useCallback with projectId as a dependency
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

      setProject(projectData[0]);
      setLocations(locationsData);
      setTracking(trackingData);

      console.log("Tracking Data:", JSON.stringify(trackingData, null, 2));

      const totalMaxScore = locationsData.reduce(
        (sum, loc) => sum + (loc.score_points || 0),
        0
      );
      setMaxScore(totalMaxScore);
    } catch (err) {
      setError("Error fetching data.");
      console.error("Error fetching project or locations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]); // Include projectId in the dependency array

  // Update useEffect to depend on fetchData
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update onRefresh to depend on fetchData
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
    const radius = 50;
    for (const loc of locations) {
      if (visitedLocations.includes(loc.id)) {
        continue;
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
        setVisitedLocations((prev) => [...prev, loc.id]);
        setTotalScore((prev) => prev + (loc.score_points || 0));
        setCurrentLocationContent(loc.location_content);
        setModalVisible(true);
        await sendTrackingData(projectId, loc.id, loc.score_points);
      }
    }
  };

  // Update sendTrackingData function
const sendTrackingData = async (projectID, locationID, score_points) => {
  try {
    const participant_username =
      (await AsyncStorage.getItem("username")) || "guest";
    const username = "s4582256"; // Replace with your actual username

    // Define tracking data structure
    const trackingData = {
      project_id: projectID,
      location_id: locationID,
      points: score_points,
      username: username,
      participant_username: participant_username,
    };

    // Fetch existing tracking entry for the project, location, and participant
    const existingTrackingEntries = await getTrackingEntry(
      participant_username,
      projectID,
      locationID
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle}>
            {project?.title || "Untitled Project"}
          </Text>
          <Text style={styles.projectInstructions}>
            {project?.instructions || "No instructions provided."}
          </Text>
        </View>

        {renderHomescreenContent()}

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Score: {totalScore}/{maxScore}
          </Text>
          <Text style={styles.scoreText}>
            Locations Visited: {visitedLocations.length}/{locations.length}
          </Text>
        </View>
      </ScrollView>

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

      {modalVisible && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <WebView
              source={{ html: currentLocationContent }}
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
