import { apiRequest } from "./fetch-request";

/**
 * Fetch all tracking entries.
 *
 * @returns {Promise<Array>} - An array of tracking objects.
 */
export const getAllTracking = () => apiRequest("/tracking");

/**
 * Fetch tracking entries by participant_username.
 *
 * @param {string} participantUsername - The participant's username.
 * @returns {Promise<Array>} - An array of tracking objects for the participant.
 */
export const getTrackingByParticipant = (participantUsername) =>
  apiRequest(`/tracking?participant_username=eq.${participantUsername}`);

/**
 * Fetch tracking entries by project_id.
 *
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<Array>} - An array of tracking objects for the project.
 */
export const getTrackingByProject = (projectId) =>
  apiRequest(`/tracking?project_id=eq.${projectId}`);

/**
 * Fetch tracking entries by location_id.
 *
 * @param {number} locationId - The ID of the location.
 * @returns {Promise<Array>} - An array of tracking objects for the location.
 */
export const getTrackingByLocation = (locationId) =>
  apiRequest(`/tracking?location_id=eq.${locationId}`);

/**
 * Create a new tracking entry.
 *
 * @param {object} trackingData - The tracking data to insert.
 * @returns {Promise<object>} - The created tracking object returned by the API.
 */
export const createTracking = (trackingData) => {
  return apiRequest("/tracking", "POST", trackingData, {
    headers: { Prefer: "return=representation" },
  });
};

/**
 * Update an existing tracking entry.
 *
 * @param {number} id - The ID of the tracking entry to update.
 * @param {object} updatedData - The updated tracking data.
 * @returns {Promise<object>} - The updated tracking object returned by the API.
 */
export const updateTracking = (id, updatedData) => {
  return apiRequest(`/tracking?id=eq.${id}`, "PATCH", updatedData, {
    headers: { Prefer: "return=representation" },
  });
};

/**
 * Delete a tracking entry.
 *
 * @param {number} id - The ID of the tracking entry to delete.
 * @returns {Promise<object>} - The response from the API after deletion.
 */
export const deleteTracking = (id) =>
  apiRequest(`/tracking?id=eq.${id}`, "DELETE");

/**
 * Get the number of unique participants in a project.
 *
 * @param {number} projectId - The ID of the project.
 * @returns {Promise<number>} - The number of unique participants.
 */
export const getParticipantCountByProject = async (projectId) => {
  try {
    // Use URLSearchParams to build query parameters
    const params = new URLSearchParams();
    params.append("project_id", `eq.${projectId}`);
    params.append("select", "participant_username");

    // Construct the endpoint with query parameters
    const endpoint = `/tracking?${params.toString()}`;

    // Make the API request
    const trackingData = await apiRequest(endpoint, "GET");

    if (!trackingData || !Array.isArray(trackingData)) {
      return 0;
    }

    // Calculate the number of unique participant usernames
    const uniqueParticipants = new Set(
      trackingData.map((item) => item.participant_username)
    );
    return uniqueParticipants.size;
  } catch (error) {
    console.error("Error fetching tracking data:", error);
    return 0; // Return 0 in case of error
  }
};
