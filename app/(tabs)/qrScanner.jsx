import React, { useEffect, useRef, useCallback, useState } from "react";
import { StyleSheet, SafeAreaView, Text, View, Button } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import API functions for handling locations and tracking data
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import {
  createTracking,
  getTrackingEntry,
} from "../../api/tracking-crud-commands";

/**
 * Sets a flag in AsyncStorage to indicate that a QR code was scanned for a specific location.
 * 
 * @param {string} locationID - The ID of the location for which the QR scan flag is being set.
 */
const setQRScanFlag = async (locationID) => {
  try {
    await AsyncStorage.setItem(`qr_scanned_${locationID}`, "true");
  } catch (error) {
    console.error(
      `Error setting QR scan flag for location ${locationID}:`,
      error
    );
  }
};

/**
 * Checks if the proximity flag is set for a specific location, indicating if the user is within range.
 * 
 * @param {string} locationID - The ID of the location to check proximity status.
 * @returns {boolean} - Returns true if proximity flag is set, otherwise false.
 */
const checkProximityFlag = async (locationID) => {
  try {
    const value = await AsyncStorage.getItem(`proximity_${locationID}`);
    return value === "true";
  } catch (error) {
    console.error(
      `Error checking proximity flag for location ${locationID}:`,
      error
    );
    return false;
  }
};

/**
 * Clears both the proximity and QR scan flags for a specific location in AsyncStorage.
 * 
 * @param {string} locationID - The ID of the location for which flags are being cleared.
 */
const clearFlags = async (locationID) => {
  try {
    await AsyncStorage.removeItem(`proximity_${locationID}`);
    await AsyncStorage.removeItem(`qr_scanned_${locationID}`);
  } catch (error) {
    console.error(`Error clearing flags for location ${locationID}:`, error);
  }
};

/**
 * Main component for the QR Code Scanner screen. Requests camera permissions, handles QR code scanning events,
 * and navigates the user based on the scanned data and location triggers.
 * 
 * @returns {JSX.Element} - The rendered component for QR Code Scanner.
 */
export default function QrCodeScanner() {
  const router = useRouter();
  const isProcessingRef = useRef(false);
  const [hasPermission, requestPermission] = useCameraPermissions();

  // Request camera permissions on component mount
  useEffect(() => {
    (async () => {
      if (hasPermission === null) {
        const { status } = await requestPermission();
      }
    })();
  }, [hasPermission, requestPermission]);

  /**
   * Handles QR code scanning event by validating the scanned data, checking the location trigger, 
   * and setting flags or sending tracking data as needed.
   * 
   * @param {object} data - The data object from the QR code scan event.
   */
  const handleBarCodeScanned = useCallback(
    async ({ data }) => {
      if (isProcessingRef.current) {
        return;
      }
      isProcessingRef.current = true;

      try {
        const qrData = data.split(",");
        if (qrData.length !== 2) {
          throw new Error("Invalid QR code format");
        }
        const [projectID, locationID] = qrData;

        const allLocations = await getLocationsByProjectID(projectID);
        const locationData = allLocations.find(
          (location) => location.id.toString() === locationID
        );

        if (locationData) {
          const { location_trigger } = locationData;

          if (
            location_trigger === "QR Code" ||
            location_trigger === "Location Entry and QR Code"
          ) {
            if (location_trigger === "QR Code") {
              // For 'QR Code' locations, track directly
              await sendTrackingData(
                projectID,
                locationID,
                locationData.score_points
              );
              router.push({ pathname: "/project", params: { locationID } });
            } else if (location_trigger === "Location Entry and QR Code") {
              // Check proximity flag for 'Location Entry and QR Code' locations
              const proximityFlag = await checkProximityFlag(locationID);

              if (proximityFlag) {
                await sendTrackingData(
                  projectID,
                  locationID,
                  locationData.score_points
                );
                await clearFlags(locationID);
                router.push({ pathname: "/project", params: { locationID } });
              } else {
                // If not within proximity, set QR scan flag silently
                await setQRScanFlag(locationID);
              }
            }
          } else {
            Alert.alert(
              "Invalid QR Code",
              "This QR code does not correspond to a QR Code triggered location."
            );
          }
        } else {
          Alert.alert(
            "Location Not Found",
            "The scanned QR code does not match any location."
          );
        }
      } catch (error) {
        Alert.alert(
          "Scan Error",
          error.message || "An error occurred while scanning."
        );
      } finally {
        isProcessingRef.current = false;
      }
    },
    [router]
  );

  /**
   * Sends tracking data for a specific location to record the user's progress, 
   * avoiding duplicate entries if tracking data already exists.
   * 
   * @param {string} projectID - ID of the project.
   * @param {string} locationID - ID of the scanned location.
   * @param {number} score_points - Points awarded for visiting the location.
   */
  const sendTrackingData = async (projectID, locationID, score_points) => {
    try {
      const participant_username =
        (await AsyncStorage.getItem("username")) || "guest";
      const username = "s4582256";

      const trackingData = {
        project_id: parseInt(projectID, 10),
        location_id: parseInt(locationID, 10),
        points: score_points,
        username: username,
        participant_username: participant_username,
      };

      const existingTrackingEntries = await getTrackingEntry(
        participant_username,
        trackingData.project_id,
        trackingData.location_id
      );

      if (existingTrackingEntries.length === 0) {
        await createTracking(trackingData);
      }
    } catch (error) {
      Alert.alert(
        "Tracking Error",
        "Failed to record your visit. Please try again."
      );
    }
  };

  // Handle camera permissions status
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        type="front"
        onBarcodeScanned={handleBarCodeScanned}
      >
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

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  message: { textAlign: "center", paddingBottom: 10 },
  camera: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topTextContainer: {
    backgroundColor: "rgb(60,60,60)",
    marginTop: 50,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    alignItems: "center",
    alignSelf: "center",
  },
  topText: { color: "#fff", fontSize: 18 },
  middleRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  sideOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  focusedContainer: { width: 250, height: 250, position: "relative" },
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
