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

// Import API functions for handling locations and tracking data
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import { createTracking, getTrackingEntry } from "../../api/tracking-crud-commands";

export default function QrCodeScanner() {
  const router = useRouter(); // Initialize router for navigation
  const isProcessingRef = useRef(false); // Ref to prevent multiple scans
  const [hasPermission, requestPermission] = useCameraPermissions(); // Manage camera permissions
  const [scanned, setScanned] = useState(false); // State to manage scanning state

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

  // Render a view for requesting camera permissions if none are granted
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

  // Handle QR code scanning event
  const handleBarCodeScanned = async ({ data }) => {
    // Prevent processing if already in progress
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true; // Mark as processing

    console.log("QR code scanned with data:", data);

    try {
      // Parse the scanned QR data
      const qrData = data.split(",");
      const [projectID, locationID] = qrData;

      // Fetch location data for the project
      const locationData = (await getLocationsByProjectID(projectID)).find(
        (location) => location.id.toString() === locationID
      );
      console.log("Fetched location data:", locationData);

      if (locationData) {
        // Send tracking data using API
        await sendTrackingData(projectID, locationID, locationData.score_points);
        console.log("Tracking data sent successfully");

        // Navigate to home screen with locationID parameter
        router.push({
          pathname: "/home",
          params: { locationID },
        });
      } else {
        // Alert user if location not found
        alert("Location not found");
        setScanned(false); // Allow re-scanning
        console.log("Location not found for ID:", locationID);
      }
    } catch (error) {
      console.error("Error handling scanned data:", error);
      alert("Invalid QR code data"); // Notify user of invalid QR code
    } finally {
      isProcessingRef.current = false; // Reset processing flag
    }
  };

  /**
   * Sends tracking data to track participant's progress at a specific location.
   *
   * @param {string} projectID - ID of the project.
   * @param {string} locationID - ID of the scanned location.
   * @param {number} score_points - Points awarded for visiting the location.
   */
  const sendTrackingData = async (projectID, locationID, score_points) => {
    try {
      // Retrieve participant's username or use 'guest' if not set
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";
      const username = "s4582256"; // Replace with actual username

      // Define tracking data structure for API
      const trackingData = {
        project_id: projectID,
        location_id: locationID,
        points: score_points,
        username: username,
        participant_username: participant_username,
      };

      // Fetch existing tracking entries for location and participant
      const existingTrackingEntries = await getTrackingEntry(
        participant_username,
        projectID,
        locationID
      );

      // Only create a new tracking entry if none exists
      if (existingTrackingEntries.length === 0) {
        console.log("Creating new tracking data entry:", trackingData);
        await createTracking(trackingData); // Create new tracking entry
      } else {
        console.log("Tracking entry already exists, skipping creation.");
      }
    } catch (error) {
      console.error("Error sending tracking data:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View for scanning QR codes */}
      <CameraView
        style={styles.camera}
        type="front"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} // Disable scanner if already scanned
      >
        {/* Overlay with instructional text */}
        <View style={styles.overlay}>
          <View style={styles.topTextContainer}>
            <Text style={styles.topText}>Find a code to scan</Text>
          </View>

          {/* Centered focus frame for QR code */}
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

// Styling constants and styles for components
const overlayColor = "rgba(0,0,0,0.5)"; // Semi-transparent black for overlay

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
