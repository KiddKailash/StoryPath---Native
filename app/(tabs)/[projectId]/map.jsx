import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import { getDistance, convertDistance } from "geolib";

export function UserLocation() {
  const [location, setLocation] = useState(null);
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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {location ? (
        <>
          <Text>
            Your location: {location.latitude}, {location.longitude}
          </Text>
          <Text>
            Distance to UQ Great Court: {getDistanceToLocation(location)} km
          </Text>
        </>
      ) : errorMsg ? (
        <Text>{errorMsg}</Text>
      ) : (
        <Text>Fetching location...</Text>
      )}
    </View>
  );
}

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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      console.log(userlocation)
    })();
  }, []);

  const initialRegion = {
    latitude: userLocation.latitude, // UQ St Lucia Campus coordinates
    longitude: userLocation.longitude,
    latitudeDelta: 0.01, // Adjusted for campus-level view
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Marker
          coordinate={{
            latitude: initialRegion.latitude,
            longitude: initialRegion.longitude,
          }}
          title="UQ St Lucia Campus"
          description="University of Queensland, St Lucia Campus"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
