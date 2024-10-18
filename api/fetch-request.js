// Constants
const API_BASE_URL = 'https://0b5ff8b0.uqcloud.net/api';
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic3R1ZGVudCIsInVzZXJuYW1lIjoiczQ1ODIyNTYifQ.zRGU_gMAa3QLIRmlhUsjv0A7RLzYyrOvmWZAXtInc6E"
const USERNAME = "s4582256"

/**
 * Helper function to handle API requests.
 * It sets the Authorization token and optionally includes the request body.
 *
 * @param {string} endpoint - The API endpoint to call.
 * @param {string} [method='GET'] - The HTTP method to use (GET, POST, PATCH, DELETE).
 * @param {object} [body=null] - The request body to send, typically for POST, PATCH, or DELETE.
 * @param {object} [options={}] - Additional options, e.g., headers.
 * @returns {Promise<object>} - The JSON response from the API.
 * @throws Will throw an error if the HTTP response is not OK.
 */
export async function apiRequest(endpoint, method = 'GET', body = null, options = {}) {
  if (!JWT_TOKEN || !USERNAME) {
    console.error('JWT_TOKEN or USERNAME is missing.');
    throw new Error('Authentication credentials are missing.');
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${JWT_TOKEN}`,
    ...options.headers,
  };

  const fetchOptions = {
    method,
    headers,
  };

  if (body) {
    // Include the username in the body for POST, PATCH, and DELETE requests
    const requestBody = { ...body, username: USERNAME };
    fetchOptions.body = JSON.stringify(requestBody);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

  if (!response.ok) {
    // Optionally, log the response body for more details
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    return null; // Or handle accordingly
  }
}
