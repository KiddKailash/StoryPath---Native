// location-crud-commands.js
import { apiRequest } from "./fetch-request";

/**
 * Fetch all locations associated with the current user.
 *
 * @returns {Promise<Array>} - An array of location objects.
 */
export const getLocations = () => apiRequest("/location");

/**
 * Fetch all locations related to a specific project ID.
 *
 * @param {string} projectId - The ID of the project to fetch related locations.
 * @returns {Promise<Array>} - An array of location objects related to the specified project.
 */
export const getLocationsByProjectID = (projectId) =>
  apiRequest(`/location?project_id=eq.${projectId}&username=eq.s4582256`);

/**
 * Create a new location.
 *
 * @param {object} locationData - The location data to insert.
 * @returns {Promise<object>} - The created location object returned by the API.
 */
export const createLocation = (locationData) => {
  return apiRequest("/location", "POST", locationData, {
    headers: { Prefer: "return=representation" },
  });
};

/**
 * Update an existing location.
 *
 * @param {string} locationId - The ID of the location to update.
 * @param {object} updatedData - The updated location data.
 * @returns {Promise<object>} - The updated location object returned by the API.
 */
export const updateLocation = (locationId, updatedData) => {
  return apiRequest(`/location?id=eq.${locationId}&username=eq.s4582256`, "PATCH", updatedData, {
    headers: { Prefer: "return=representation" },
  });
};

/**
 * Delete a location.
 *
 * @param {string} locationId - The ID of the location to delete.
 * @returns {Promise<object>} - The response from the API after deletion.
 */
export const deleteLocation = (locationId) =>
  apiRequest(`/location?id=eq.${locationId}&username=eq.s4582256`, "DELETE");
