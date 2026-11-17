import express from 'express';
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  getTripParticipants,
  addParticipant,
  updateParticipant,
  removeParticipant,
  inviteParticipant,
  joinTripByCode,
  getTripByInviteCode,
  getTripItinerary,
  addActivity,
  updateActivity,
  deleteActivity,
  getTripExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/tripController.js';

const router = express.Router();

// Public routes for trip discovery and joining
router.post('/join', joinTripByCode);
router.get('/invite/:inviteCode', getTripByInviteCode);

// Base trip routes
router.get('/', getAllTrips);
router.post('/', createTrip);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);

// Participant management routes (Heer Shah - Module 2)
router.get('/:id/participants', getTripParticipants);
router.post('/:id/participants', addParticipant);
router.put('/:id/participants/:participantId', updateParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);
router.post('/:id/invite', inviteParticipant);

// Itinerary management routes (Module 1 - Part 3 / Stage 4)
router.get('/:id/itinerary', getTripItinerary);
router.post('/:id/itinerary', addActivity);
router.put('/:id/itinerary/:activityId', updateActivity);
router.delete('/:id/itinerary/:activityId', deleteActivity);

// Expense management routes (Heer Shah - Module 2 - Part 3)
router.get('/:id/expenses', getTripExpenses);
router.post('/:id/expenses', addExpense);
router.put('/:id/expenses/:expenseId', updateExpense);
router.delete('/:id/expenses/:expenseId', deleteExpense);

export default router;
