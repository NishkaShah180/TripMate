/**
 * Trip service for API communication.
 * Communicates with the backend using native fetch().
 */

const API_BASE_URL = '/api/trips';

/**
 * Create a new trip
 * @param {Object} tripData - { name, destination, startDate, endDate, description }
 * @returns {Promise<Object>} Response object containing saved trip
 */
export async function createTrip(tripData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tripData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
