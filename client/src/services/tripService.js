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

/**
 * ============================================================================
 * Itinerary Management Services (Module 1 - Part 3 / Stage 4)
 * ============================================================================
 */

/**
 * Fetch all itinerary activities for a trip
 * @param {string} tripId
 */
export async function getTripItinerary(tripId) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/itinerary`);
  return handleResponse(response);
}

/**
 * Add a new activity to a trip itinerary
 * @param {string} tripId
 * @param {Object} activityData - { title, date, startTime, location, notes }
 */
export async function addActivity(tripId, activityData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  });
  return handleResponse(response);
}

/**
 * Update an existing activity in a trip itinerary
 * @param {string} tripId
 * @param {string} activityId
 * @param {Object} activityData - { title, date, startTime, location, notes }
 */
export async function updateActivity(tripId, activityId, activityData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/itinerary/${activityId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activityData),
  });
  return handleResponse(response);
}

/**
 * Delete an activity from a trip itinerary
 * @param {string} tripId
 * @param {string} activityId
 */
export async function deleteActivity(tripId, activityId) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/itinerary/${activityId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

/**
 * ============================================================================
 * Expense Management Services (Module 2 - Part 3 - Heer Shah)
 * ============================================================================
 */

/**
 * Fetch all expenses for a trip
 * @param {string} tripId
 */
export async function getTripExpenses(tripId) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/expenses`);
  return handleResponse(response);
}

/**
 * Add a new expense to a trip
 * @param {string} tripId
 * @param {Object} expenseData - { title, amount, category, date, paidBy, paidByName, notes }
 */
export async function addExpense(tripId, expenseData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });
  return handleResponse(response);
}

/**
 * Update an existing expense in a trip
 * @param {string} tripId
 * @param {string} expenseId
 * @param {Object} expenseData - { title, amount, category, date, paidBy, paidByName, notes }
 */
export async function updateExpense(tripId, expenseId, expenseData) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });
  return handleResponse(response);
}

/**
 * Delete an expense from a trip
 * @param {string} tripId
 * @param {string} expenseId
 */
export async function deleteExpense(tripId, expenseId) {
  const response = await fetch(`${API_BASE_URL}/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

