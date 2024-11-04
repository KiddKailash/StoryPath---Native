import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getProjects } from "../api/project-crud-commands";
import { getParticipantCountByProject } from "../api/tracking-crud-commands";

/**
 * ProjectsList component displays a list of published projects
 * along with the number of participants in each project.
 * It supports pull-to-refresh functionality and navigation
 * to individual project details.
 *
 * @returns {JSX.Element} The rendered ProjectsList component.
 */
export default function ProjectsList() {
  const router = useRouter(); // Hook to access the router for navigation
  const [projects, setProjects] = useState([]); // State to hold the list of projects
  const [loading, setLoading] = useState(true); // State to manage loading indicator
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh control

  /**
   * fetchProjects fetches the list of published projects and their participant counts.
   * It updates the state with the fetched data.
   */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const projectsData = await getProjects();
      const publishedProjects = projectsData.filter(
        (project) => project.is_published === true
      );

      // Fetch participant counts for each published project
      const projectsWithCounts = await Promise.all(
        publishedProjects.map(async (project) => {
          const participantCount = await getParticipantCountByProject(
            project.id
          );
          return { ...project, participantCount };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error) {
      console.error("Error fetching projects or participant counts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * useFocusEffect ensures that fetchProjects is called each time the screen is focused.
   */
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [])
  );

  /**
   * onRefresh handles the pull-to-refresh action.
   * It sets the refreshing state to true and re-fetches the projects.
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, []);

  /**
   * navigateToProject navigates to the project details screen for the given project ID.
   *
   * @param {number} projectId - The ID of the project to navigate to.
   */
  const navigateToProject = (projectId) => {
    console.log("Navigating to project:", projectId);
    router.push({
      pathname: "/home",
      params: { projectId },
    });
  };

  // Display a loading indicator while data is being fetched
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Published Projects</Text>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.projectItem}
            onPress={() => navigateToProject(item.id)}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text>Participants: {item.participantCount}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No published projects available.</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

/**
 * styles defines the styling for the ProjectsList component.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1, // Enables flex layout to fill the screen
    padding: 16, // Adds padding around the container
  },
  loaderContainer: {
    flex: 1, // Enables flex layout to fill the screen
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
  },
  header: {
    fontSize: 24, // Sets the font size for the header
    fontWeight: "bold", // Makes the header text bold
    marginBottom: 16, // Adds margin below the header
  },
  projectItem: {
    padding: 12, // Adds padding inside each project item
    marginBottom: 12, // Adds margin below each project item
    backgroundColor: "#f9f9f9", // Sets the background color for project items
    borderRadius: 6, // Rounds the corners of the project item
  },
  title: {
    fontSize: 18, // Sets the font size for the project title
    fontWeight: "bold", // Makes the project title text bold
  },
});
