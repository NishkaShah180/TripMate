/**
 * Trip service for API communication.
 * Communicates with the backend using native fetch().
 */

const API_BASE_URL = '/api/trips';

/**
 * Handle API JSON response and errors uniformly
 */
async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

/**
 * Fetch all trips with participant count
 */
export async function getAllTrips() {
  const response = await fetch(API_BASE_URL);
  return handleResponse(response);
}

/**
 * Fetch a single trip by ID with participants
 */
export async function getTripById(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`);
  return handleResponse(response);
}

/**
 * Create a new trip with optional organizer participant
 * @param {Object} tripData - { name, destination, startDate, endDate, description, organizerName, organizerEmail }
 */
export async function createTrip(tripData) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripData),
  });
  return handleResponse(response);
}

/**
 * Update an existing trip (Module 1 - Nishka Shah)
 * @param {string} id
 * @param {Object} tripData - { name, destination, startDate, endDate, description }
 */
export async function updateTrip(id, tripData) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripData),
  });
  return handleResponse(response);
}

/**
 * Get all participants for a trip
 * @param {string} tripId
 */
export async function getTripParticipants(tripId) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/participants`);
  return handleResponse(response);
}

/**
 * Add a participant to a trip (Module 2 - Heer Shah)
 * @param {string} tripId
 * @param {Object} participantData - { name, email, role, status }
 */
export async function addParticipant(tripId, participantData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(participantData),
  });
  return handleResponse(response);
}

/**
 * Update a participant's role or details (Module 2 - Heer Shah)
 * @param {string} tripId
 * @param {string} participantId
 * @param {Object} updateData - { role, name, email }
 */
export async function updateParticipant(tripId, participantId, updateData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/participants/${participantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  return handleResponse(response);
}

/**
 * Remove a participant from a trip (Module 2 - Heer Shah)
 */
export async function removeParticipant(tripId, participantId) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/participants/${participantId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

/**
 * Generate invite details for a participant
 */
export async function inviteParticipant(tripId, inviteData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inviteData),
  });
  return handleResponse(response);
}

/**
 * Join a trip using an invite code
 * @param {Object} joinData - { inviteCode, name, email }
 */
export async function joinTripByCode(joinData) {
  const response = await fetch(`${API_BASE_URL}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(joinData),
  });
  return handleResponse(response);
}

/**
 * Get public preview of trip by invite code
 */
export async function getTripPreviewByCode(inviteCode) {
  const response = await fetch(`${API_BASE_URL}/invite/${encodeURIComponent(inviteCode)}`);
  return handleResponse(response);
}
