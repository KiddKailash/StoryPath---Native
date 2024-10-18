// project-crud-commands.js
import { apiRequest } from "./fetch-request";

/**
 * Fetch all projects.
 *
 * @returns {Promise<Array>} - An array of project objects.
 */
export const getProjects = () => apiRequest("/project");

/**
 * Fetch a project by its ID.
 *
 * @param {string} projectId - The ID of the project to fetch.
 * @returns {Promise<object|null>} - The project object if found, or null if not found.
 */
export const getProjectById = async (projectId) => {
  return await apiRequest(`/project?id=eq.${projectId}`);
};

/**
 * Create a new project.
 *
 * @param {object} projectData - The project data to insert.
 * @returns {Promise<object>} - The created project object returned by the API.
 */
export const createProject = (projectData) => {
  return apiRequest("/project", "POST", projectData, {
    headers: { Prefer: "return=representation" },
  });
};

/**
 * Update an existing project.
 *
 * @param {string} id - The ID of the project to update.
 * @param {object} updatedData - The updated project data.
 * @returns {Promise<object>} - The updated project object returned by the API.
 */
export const updateProject = (id, updatedData) => {
  return apiRequest(`/project?id=eq.${id}`, "PATCH", updatedData, {
    headers: { Prefer: "return=representation" },
  });
};

/**
 * Delete a project.
 *
 * @param {string} id - The ID of the project to delete.
 * @returns {Promise<object>} - The response from the API after deletion.
 */
export const deleteProject = (id) =>
  apiRequest(`/project?id=eq.${id}`, "DELETE");
