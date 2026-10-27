import express from 'express';
import {
  createTrip,
  getAllTrips,
  getTripById,
  addParticipant,
  removeParticipant,
  inviteParticipant,
  joinTripByCode,
  getTripByInviteCode,
} from '../controllers/tripController.js';

const router = express.Router();

// Public routes for trip discovery and joining
router.post('/join', joinTripByCode);
router.get('/invite/:inviteCode', getTripByInviteCode);

// Base trip routes
router.get('/', getAllTrips);
router.post('/', createTrip);
router.get('/:id', getTripById);

// Participant management routes
router.post('/:id/participants', addParticipant);
router.delete('/:id/participants/:participantId', removeParticipant);
router.post('/:id/invite', inviteParticipant);

export default router;
