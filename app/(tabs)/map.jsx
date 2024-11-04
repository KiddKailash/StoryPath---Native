import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Circle } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import { getTrackingByParticipant } from "../../api/tracking-crud-commands";
import { Appearance } from "react-native";

// Determine the current color scheme (light or dark)
const colorScheme = Appearance.getColorScheme();

export default function Map() {
  const { projectId } = useLocalSearchParams(); // Retrieve projectId from navigation params

  // State variables
  const [userLocation, setUserLocation] = useState(null);
  const [visitedLocationsData, setVisitedLocationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  /**
   * Fetches the username from AsyncStorage.
   * Returns 'guest' if not found.
   */
  const fetchUsername = useCallback(async () => {
    try {
      const username = (await AsyncStorage.getItem("username")) || "guest";
      return username;
    } catch (error) {
      console.error("Error fetching username:", error);
      return "guest";
    }
  }, []);

  /**
   * Fetches user's current location.
   */
  const fetchUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({});
      return loc.coords;
    } catch (error) {
      setErrorMsg("Error getting location");
      console.error(error);
      return null;
    }
  }, []);

  /**
   * Fetches visited locations based on tracking data.
   * Utilizes the username to fetch relevant tracking entries.
   */
  const fetchVisitedLocations = useCallback(
    async (username) => {
      try {
        // Get tracking data for the participant
        const trackingData = await getTrackingByParticipant(username);

        // Extract visited location IDs from tracking data for the current project
        const visitedLocationIds = trackingData
          .filter((entry) => entry.project_id === parseInt(projectId, 10))
          .map((entry) => entry.location_id);

        if (visitedLocationIds.length === 0) {
          // No visited locations
          setVisitedLocationsData([]);
          return;
        }

        // Fetch all locations for the project and user
        const allLocations = await getLocationsByProjectID(projectId);

        // Filter only the visited locations based on location IDs
        const visitedLocations = allLocations.filter((loc) =>
          visitedLocationIds.includes(loc.id)
        );

        setVisitedLocationsData(visitedLocations);
      } catch (error) {
        console.error("Error fetching visited locations:", error);
        setErrorMsg("Error fetching visited locations");
      }
    },
    [projectId]
  );

  /**
   * Fetches user location and visited locations concurrently.
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [username, coords] = await Promise.all([
        fetchUsername(),
        fetchUserLocation(),
      ]);

      if (coords) {
        setUserLocation(coords);
      }

      await fetchVisitedLocations(username);
    } catch (error) {
      console.error("Error during data fetching:", error);
      setErrorMsg("Error fetching data");
    } finally {
      setLoading(false);
    }
  }, [fetchUsername, fetchUserLocation, fetchVisitedLocations]);

  /**
   * useFocusEffect ensures that fetchData is called each time the screen is focused.
   * This keeps the data up-to-date when returning to the screen.
   */
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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
          setErrorMsg("Permission to access location was denied");
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

            // Optional: Update user location state if you want real-time tracking
            setUserLocation(userCoords);

            // Fetch username for tracking updates
            const username = await fetchUsername();

            try {
              // Get tracking data
              const trackingData = await getTrackingByParticipant(username);

              // Extract visited location IDs for the current project
              const visitedLocationIds = trackingData
                .filter((entry) => entry.project_id === parseInt(projectId, 10))
                .map((entry) => entry.location_id);

              // Fetch all locations for the project and user
              const allLocations = await getLocationsByProjectID(projectId);

              // Identify newly visited locations (if any)
              const newlyVisitedLocations = allLocations.filter(
                (loc) =>
                  visitedLocationIds.includes(loc.id) &&
                  !visitedLocationsData.some((vLoc) => vLoc.id === loc.id)
              );

              if (newlyVisitedLocations.length > 0) {
                // Update visited locations data
                setVisitedLocationsData((prevData) => [
                  ...prevData,
                  ...newlyVisitedLocations,
                ]);
              }
            } catch (error) {
              console.error("Error updating visited locations:", error);
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
  }, [projectId, fetchUsername, visitedLocationsData]);

  /**
   * Determines the initial region for the map based on user location.
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
   * Renders the map with circles for visited locations.
   */
  const renderMap = () => (
    <MapView
      style={styles.map}
      initialRegion={getInitialRegion()}
      showsUserLocation={true} // Display default user location marker
      showsMyLocationButton={true} // Optional: show the "my location" button
      loadingEnabled={true} // Show loading indicator for map tiles
    >
      {/* Circles for visited locations */}
      {visitedLocationsData.map((loc) => {
        const [latitude, longitude] = loc.location_position
          .replace("(", "")
          .replace(")", "")
          .split(",")
          .map((coord) => parseFloat(coord.trim()));

        return (
          <Circle
            key={loc.id}
            center={{ latitude, longitude }}
            radius={75}
            strokeWidth={3}
            strokeColor="#A42DE8"
            fillColor={
              colorScheme === "dark"
                ? "rgba(128,0,128,0.5)"
                : "rgba(210,169,210,0.5)"
            }
          />
        );
      })}
    </MapView>
  );

  // Render based on loading, error, or map display state
  if (errorMsg) {
    return renderError();
  }

  if (loading || !userLocation) {
    return renderLoading();
  }

  return <View style={styles.container}>{renderMap()}</View>;
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
});
