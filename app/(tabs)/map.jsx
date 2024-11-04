import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getLocationsByProjectID } from "../../api/location-crud-commands";
import {
  getTrackingByParticipant,
  getTrackingEntry,
} from "../../api/tracking-crud-commands";

/**
 * Map component displays a map with markers for visited locations.
 * If no locations have been visited, it displays only the user's location.
 *
 * @return {JSX.Element} - The rendered Map component.
 */
export default function Map() {
  const { projectId } = useLocalSearchParams(); // Get project ID from route parameters
  console.log("Map projectId:", projectId);

  // State variables
  const [userLocation, setUserLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [visitedLocationsData, setVisitedLocationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  /**
   * Fetches user's current location.
   */
  const fetchUserLocation = useCallback(async () => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      // Get current location
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
      console.log("User location:", loc.coords);
    } catch (error) {
      setErrorMsg("Error getting location");
      console.error(error);
    }
  }, []);

  /**
   * Fetches locations associated with the project.
   */
  const fetchLocations = useCallback(async () => {
    try {
      // Get project locations from API
      const locationsData = await getLocationsByProjectID(projectId);
      setLocations(locationsData);
      console.log("Fetched locations:", locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setErrorMsg("Error fetching locations");
    }
  }, [projectId]);

  /**
   * Fetches tracking data to identify visited locations.
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

      // Filter to get details of visited locations
      const visitedData = locations.filter((loc) =>
        visitedLocationIds.includes(loc.id)
      );
      setVisitedLocationsData(visitedData);
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setErrorMsg("Error fetching tracking data");
    }
  }, [projectId, locations]);

  /**
   * Fetches all required data for the map view.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await fetchUserLocation(); // Get user's location
      await fetchLocations(); // Get locations associated with the project
    } catch (error) {
      console.error("Error during data fetching:", error);
      setErrorMsg("Error fetching data");
    } finally {
      setLoading(false); // Stop loading indicator
    }
  }, [fetchUserLocation, fetchLocations]);

  /**
   * Fetches data when the screen is focused or when pull-to-refresh is used.
   */
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  /**
   * Initial data fetch when component mounts.
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Refresh handler for pull-to-refresh.
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => {
      setRefreshing(false);
    });
  }, [fetchData]);

  /**
   * Watches user's location to update visited locations when nearby.
   */
  useEffect(() => {
    let locationSubscription = null;

    const watchUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 5000, // Update every 5 seconds
          },
          async (location) => {
            const userCoords = location.coords;
            console.log("Updated user location:", userCoords);

            const radius = 50; // Radius in meters for proximity check
            for (const loc of locations) {
              if (visitedLocationsData.some((vLoc) => vLoc.id === loc.id)) {
                continue; // Skip if location has already been visited
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

              // Calculate distance to the location
              const distance = getDistance(
                { latitude: userCoords.latitude, longitude: userCoords.longitude },
                locationCoords
              );

              console.log(
                `Distance to ${loc.location_name}: ${distance} meters`
              );

              // If user is within radius, mark location as visited
              if (distance <= radius) {
                console.log(`User has arrived at location ${loc.location_name}`);

                // Send tracking data to server
                await sendTrackingData(projectId, loc.id, loc.score_points);

                // Fetch tracking data to refresh visited locations
                await fetchTrackingData();
              }
            }
          }
        );
      } catch (error) {
        console.error("Error watching location:", error);
        setErrorMsg("Error watching location");
      }
    };

    watchUserLocation();

    // Cleanup location subscription when component unmounts
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locations, visitedLocationsData, projectId, fetchTrackingData]);

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
    }
  };

  /**
   * Renders a loading indicator.
   *
   * @return {JSX.Element} - Loading view.
   */
  const renderLoading = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Loading map...</Text>
    </View>
  );

  /**
   * Renders error message if any error occurs.
   *
   * @return {JSX.Element} - Error message view.
   */
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{errorMsg}</Text>
    </View>
  );

  /**
   * Sets initial region of the map based on user location.
   */
  const getInitialRegion = () => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    // Default region if user location is unavailable
    return {
      latitude: -27.5263381,
      longitude: 153.0954163,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  /**
   * Renders the map with markers for user's and visited locations.
   */
  const renderMap = () => (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={getInitialRegion()}>
        {/* Marker for user's current location */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your Location"
          description="This is where you are"
          pinColor="blue"
        />

        {/* Markers for visited locations */}
        {visitedLocationsData.length > 0 &&
          visitedLocationsData.map((loc) => {
            const [latitude, longitude] = loc.location_position
              .replace("(", "")
              .replace(")", "")
              .split(",")
              .map((coord) => parseFloat(coord.trim()));

            return (
              <Marker
                key={loc.id}
                coordinate={{ latitude, longitude }}
                title={loc.location_name}
                description={loc.clue || "No clue provided"}
                pinColor="green"
              >
                {/* Callout with location details */}
                <Callout>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{loc.location_name}</Text>
                    <Text style={styles.calloutDescription}>
                      {loc.clue || "No clue provided"}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
      </MapView>
    </View>
  );

  // Render based on loading, error, or map display state
  if (errorMsg) {
    return renderError();
  }

  if (!userLocation || loading) {
    return renderLoading();
  }

  return renderMap();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  map: {
    width: "100%",
    height: "100%",
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
