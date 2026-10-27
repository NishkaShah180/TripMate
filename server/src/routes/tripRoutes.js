import express from 'express';
import { createTrip } from '../controllers/tripController.js';

const router = express.Router();

// POST /api/trips - Create a new trip
router.post('/', createTrip);

export default router;
