import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  SafeAreaView,
  Text,
  View,
  Button,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router"; // Importing useRouter for navigation
import AsyncStorage from "@react-native-async-storage/async-storage";

// Corrected imports
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import { createTracking, getTrackingEntry } from "../../api/tracking-crud-commands";

export default function QrCodeScanner() {
  const router = useRouter(); // Initialize router for navigation
  const isProcessingRef = useRef(false);
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Request camera permissions on component mount
  useEffect(() => {
    (async () => {
      if (hasPermission === null) {
        console.log("Requesting camera permissions...");
        const { status } = await requestPermission();
        console.log("Camera permissions:", status === "granted");
      } else {
        console.log(
          "Camera permissions already determined:",
          hasPermission.granted
        );
      }
    })();
  }, []);

  // Handle camera permission states
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission.granted) {
    console.log("Camera permission not granted");
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </SafeAreaView>
    );
  }

  // Handle QR code scanning
  const handleBarCodeScanned = async ({ data }) => {
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    console.log("QR code scanned with data:", data);

    try {
      // Parse the scanned data
      const qrData = data.split(",");
      const [projectID, locationID] = qrData;

      // Fetch the location content using the API function
      const locationData = (await getLocationsByProjectID(projectID)).find(
        (location) => location.id.toString() === locationID
      );
      console.log("Fetched location data:", locationData);

      if (locationData) {
        // Send tracking data using the API function
        await sendTrackingData(projectID, locationID, locationData.score_points);
        console.log("Tracking data sent successfully");

        // Navigate to home.jsx and pass locationID as a parameter
        router.push({
          pathname: "/home",
          params: { locationID }, // Pass locationID to home.jsx
        });
      } else {
        alert("Location not found");
        setScanned(false);
        console.log("Location not found for ID:", locationID);
      }
    } catch (error) {
      console.error("Error handling scanned data:", error);
      alert("Invalid QR code data");
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Send tracking data to the tracking endpoint using the API function
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

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        type="front"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          <View style={styles.topTextContainer}>
            <Text style={styles.topText}>Find a code to scan</Text>
          </View>

          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.focusedContainer}>
              <View style={styles.topLeftCorner} />
              <View style={styles.topRightCorner} />
              <View style={styles.bottomLeftCorner} />
              <View style={styles.bottomRightCorner} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const overlayColor = "rgba(0,0,0,0.5)"; // Semi-transparent black

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topTextContainer: {
    backgroundColor: "rgb(60,60,60)",
    marginTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "center",
  },
  topText: {
    color: "#fff",
    fontSize: 18,
  },
  middleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: overlayColor,
  },
  focusedContainer: {
    width: 250,
    height: 250,
    position: "relative",
  },
  topLeftCorner: {
    position: "absolute",
    top: -40,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "white",
    borderTopLeftRadius: 15,
  },
  topRightCorner: {
    position: "absolute",
    top: -40,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "white",
    borderTopRightRadius: 15,
  },
  bottomLeftCorner: {
    position: "absolute",
    bottom: 30,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "white",
    borderBottomLeftRadius: 15,
  },
  bottomRightCorner: {
    position: "absolute",
    bottom: 40,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "white",
    borderBottomRightRadius: 15,
  },
});
