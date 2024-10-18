import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getProjectById } from "../../../api/project-crud-commands";
import { getLocationsByProjectID } from "../../../api/location-crud-commands";

export default function HomeScreen() {
  const { projectId } = useLocalSearchParams();

  const [project, setProject] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [error, setError] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [visitedLocations, setVisitedLocations] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    // Fetch project data
    const fetchProject = async () => {
      try {
        const projectData = await getProjectById(projectId);
        setProject(projectData);
        console.log("Project State:", projectData);
        setLoadingProject(false);
      } catch (err) {
        setError("Error fetching project data.");
        setLoadingProject(false);
      }
    };

    // Fetch locations data
    const fetchLocations = async () => {
      try {
        const locationsData = await getLocationsByProjectID(projectId);
        setLocations(locationsData);
        // Calculate max score
        const totalMaxScore = locationsData.reduce(
          (sum, loc) => sum + (loc.score_points || 0),
          0
        );
        setMaxScore(totalMaxScore);
        setLoadingLocations(false);
      } catch (err) {
        setError("Error fetching locations data.");
        setLoadingLocations(false);
      }
    };

    fetchProject();
    fetchLocations();
  }, [projectId]);

  if (loadingProject || loadingLocations) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const getUserSelectText = () => {
    if (project.participant_scoring === "Number of Scanned QR Codes") {
      return "Scan QR Code at Location:";
    }
    return "Go to Location:";
  };

  const userSelectText = getUserSelectText();

  const handleLocationChange = (itemValue) => {
    if (itemValue === "") return;

    const locationId = parseInt(itemValue, 10);
    const location = locations.find((loc) => loc.id === locationId);

    if (location && !visitedLocations.includes(locationId)) {
      setVisitedLocations([...visitedLocations, locationId]);
      setTotalScore((prevScore) => prevScore + (location.score_points || 0));
    }

    setSelectedLocation(location || null);
  };

  const resetSelectedLocation = () => {
    setSelectedLocation(null);
  };

  const renderHomescreenContent = () => {
    if (project.homescreen_display === "display_initial_clue") {
      return (
        <View style={styles.homescreenContent}>
          <Text style={styles.sectionTitle}>Initial Clue</Text>
          <Text style={styles.sectionContent}>{project.initial_clue}</Text>
        </View>
      );
    } else if (project.homescreen_display === "display_all_locations") {
      return (
        <View style={styles.homescreenContent}>
          <Text style={styles.sectionTitle}>All Locations</Text>
          {locations.map((location) => (
            <Text key={location.id} style={styles.sectionContent}>
              {location.location_name} - {location.clue || "No clue provided"}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Project Title & Instructions */}
      <View style={styles.projectInfo}>
        <Text style={styles.projectTitle}>
          {project[0].title || "Untitled Project"}
        </Text>
        <Text style={styles.projectInstructions}>
          {project[0].instructions || "No instructions provided."}
        </Text>
      </View>
      {/* Score and Location Count */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>
          Score: {totalScore}/{maxScore}
        </Text>
        <Text style={styles.scoreText}>
          Locations Visited: {visitedLocations.length}/{locations.length}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
  projectInfo: {
    marginBottom: 16,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  projectInstructions: {
    fontSize: 16,
    color: "#555",
  },
  scoreContainer: {
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 16,
  },
  selectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    backgroundColor: "#f0f0f0",
  },
  homescreenContent: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    marginBottom: 4,
  },
  locationDetails: {
    marginBottom: 16,
  },
});
