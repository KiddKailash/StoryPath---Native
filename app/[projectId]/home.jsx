import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  SafeAreaView,
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

  const [visitedLocations, setVisitedLocations] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  useEffect(() => {
    // Fetch project data
    const fetchProject = async () => {
      try {
        const projectData = await getProjectById(projectId);
        setProject(projectData[0]); // Assume the API returns an array, use the first element
        console.log("Project State:", projectData[0]);
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
              {`- ${location.location_name}`}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <>
      <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Project Title & Instructions */}
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>
              {project.title || "Untitled Project"}
            </Text>
            <Text style={styles.projectInstructions}>
              {project.instructions || "No instructions provided."}
            </Text>
          </View>

          {/* Initial Clue or All Locations */}
          {renderHomescreenContent()}

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
      </SafeAreaView>
    </>
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
});
