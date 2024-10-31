import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  SafeAreaView,
  Text,
  View,
  Button,
  Modal,
} from "react-native";
import { CameraView } from "expo-camera";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { getLocationsByProjectID } from "../../api/location-crud-commands";
import { createTracking } from "../../api/tracking-crud-commands";

export default function QrCodeScanner() {
  const { projectId } = useLocalSearchParams();
  
  console.log("QR Scanner projectId:", projectId);

  const isProcessingRef = useRef(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationContent, setLocationContent] = useState("");
  const [cameraRef, setCameraRef] = useState(null);

  // Request camera permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await CameraView.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
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

  if (!hasPermission) {
    console.log("Camera permission not granted");
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <Button
          onPress={() => {
            CameraView.requestCameraPermissionsAsync().then(({ status }) =>
              setHasPermission(status === "granted")
            );
          }}
          title="Grant Permission"
        />
      </SafeAreaView>
    );
  }

  // Handle QR code scanning
  const handleBarCodeScanned = async ({ data }) => {
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;
    setScanned(true);

    console.log("QR code scanned with data:", data);

    try {
      // Parse the scanned data
      const qrData = data.split(",");
      const [scannedProjectId, locationID] = qrData;

      // Ensure the scanned QR code matches the current project
      if (scannedProjectId !== projectId) {
        alert("This QR code does not belong to this project.");
        setScanned(false);
        isProcessingRef.current = false;
        return;
      }

      // Fetch the location content using the API function
      const locationData = (
        await getLocationsByProjectID(projectId)
      ).find((location) => location.id.toString() === locationID);

      console.log("Fetched location data:", locationData);

      if (locationData) {
        setLocationContent(locationData.location_content);
        setModalVisible(true);
        console.log("Location content set and modal opened");
      } else {
        alert("Location not found");
        setScanned(false);
        console.log("Location not found for ID:", locationID);
        return;
      }

      // Send tracking data using the API function
      await sendTrackingData(projectId, locationID, locationData.score_points);
      console.log("Tracking data sent successfully");
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
      // Retrieve participant's username from AsyncStorage
      const participant_username = await AsyncStorage.getItem("username") || "guest";
      const username = "s4582256"; // Replace with appropriate username
      console.log("Participant username:", participant_username);

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

  // Close the modal and reset states
  const handleCloseModal = () => {
    setModalVisible(false);
    setScanned(false);
    setLocationContent("");
    console.log("Modal closed and states reset");
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        type={Camera.Constants.Type.back}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        ref={(ref) => {
          setCameraRef(ref);
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Top Text */}
          <View style={styles.topTextContainer}>
            <Text style={styles.topText}>Find a code to scan</Text>
          </View>

          {/* Middle Row */}
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.focusedContainer}>
              {/* Corner Decorations */}
              <View style={styles.topLeftCorner} />
              <View style={styles.topRightCorner} />
              <View style={styles.bottomLeftCorner} />
              <View style={styles.bottomRightCorner} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
        </View>
      </CameraView>

      {modalVisible && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <WebView source={{ html: locationContent }} style={{ flex: 1 }} />
            <Button title="Close" onPress={handleCloseModal} />
          </SafeAreaView>
        </Modal>
      )}
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
    backgroundColor: "rgba(60,60,60,0.7)",
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
