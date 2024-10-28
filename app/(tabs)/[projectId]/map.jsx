import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import { getDistance, convertDistance } from "geolib";

export default function Map() {
  const [userLocation, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const getDistanceToLocation = (userLocation) => {
    // Example: UQ Great Court
    const destination = {
      latitude: -27.49763309197018,
      longitude: 153.01291742634757,
    };
    const distance = getDistance(userLocation, destination);

    return convertDistance(distance, "km"); // convert to kilometers
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        console.log("User location:", loc.coords);
      } catch (error) {
        setErrorMsg("Error getting location");
        console.error(error);
      }
    })();
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.loaderContainer}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!userLocation) {
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
        {/* UQ Great Court Marker */}
        <Marker
          coordinate={{
            latitude: -27.49763309197018,
            longitude: 153.01291742634757,
          }}
          title="UQ Great Court"
          description="University of Queensland, Great Court"
        />
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
