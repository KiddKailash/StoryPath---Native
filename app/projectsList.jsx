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
import { getProjects } from "../api/project-crud-commands";
import { getParticipantCountByProject } from "../api/tracking-crud-commands";

export default function ProjectsList() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch projects and participant counts
  const fetchProjects = async () => {
    try {
      const projectsData = await getProjects();
      const publishedProjects = projectsData.filter(
        (project) => project.is_published === true
      );

      // Fetch participant counts for each project
      const projectsWithCounts = await Promise.all(
        publishedProjects.map(async (project) => {
          const participantCount = await getParticipantCountByProject(project.id);
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

  useEffect(() => {
    fetchProjects(); // Fetch projects on mount
  }, []);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, []);

  // Function to navigate to project details or screens
  const navigateToProject = (projectId) => {
    router.push(`/${projectId}/home`);
  };

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  projectItem: {
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
});
