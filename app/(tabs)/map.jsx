import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { useLocalSearchParams } from "expo-router";
import * as Location from "expo-location";
import { getDistance, convertDistance } from "geolib";
import { getLocationsByProjectID } from "../../api/location-crud-commands";

export default function Map() {
  const { projectId } = useLocalSearchParams();
  console.log("Map projectId:", projectId);

  const [userLocation, setUserLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setUserLocation(loc.coords);
        console.log("User location:", loc.coords);
      } catch (error) {
        setErrorMsg("Error getting location");
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const locationsData = await getLocationsByProjectID(projectId);
        setLocations(locationsData);
        setLoadingLocations(false);
        console.log("Fetched locations:", locationsData);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setErrorMsg("Error fetching locations");
        setLoadingLocations(false);
      }
    };

    if (projectId) {
      fetchLocations();
    }
  }, [projectId]);

  if (errorMsg) {
    return (
      <View style={styles.loaderContainer}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!userLocation || loadingLocations) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {/* User's Location Marker */}
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Your Location"
          description="This is where you are"
        />
        {/* Project Locations Markers */}
        {locations.map((location) => {
          const [latitude, longitude] = location.location_position
            .replace("(", "")
            .replace(")", "")
            .split(",")
            .map(Number);

          return (
            <Marker
              key={location.id}
              coordinate={{ latitude, longitude }}
              title={location.location_name}
              description={location.clue}
            />
          );
        })}
      </MapView>
    </View>
  );
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
  map: {
    width: "100%",
    height: "100%",
  },
});
