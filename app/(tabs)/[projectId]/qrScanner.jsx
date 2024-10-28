// QrCodeScanner.jsx

import React, { useState } from "react";
import { StyleSheet, Text, View, Button, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { WebView } from "react-native-webview";

export default function QrCodeScanner() {
  const [hasPermission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState("");

  if (hasPermission === null) {
    // Camera permissions are still loading
    return (
      <View style={styles.permissionContainer}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission.status !== "granted") {
    // Camera permissions are not granted yet
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.message}>
          We need your permission to access the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setScannedData(data);
  };

  const handleCloseModal = () => {
    setScanned(false);
    setScannedData("");
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
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

      {scanned && (
        <Modal
          visible={scanned}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.invalidDataContainer}>
              <Text style={styles.invalidDataText}>Scanned Data:</Text>
              <Text style={styles.invalidDataContent}>{scannedData}</Text>
            </View>
            <Button title="Close" onPress={handleCloseModal} />
          </View>
        </Modal>
      )}
    </View>
  );
}

const overlayColor = "rgba(0,0,0,0.5)"; // Semi-transparent black

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: "#888",
    paddingVertical: 10,
    alignItems: "center",
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
    top: 0,
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
    top: 0,
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
    bottom: 0,
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
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "white",
    borderBottomRightRadius: 15,
  },
  invalidDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  invalidDataText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  invalidDataContent: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
