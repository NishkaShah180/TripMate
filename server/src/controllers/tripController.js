import Trip from '../models/Trip.js';

/**
 * @desc    Create a new trip
 * @route   POST /api/trips
 * @access  Public
 */
export const createTrip = async (req, res, next) => {
  try {
    const { name, destination, startDate, endDate, description } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Trip name is required',
      });
    }

    if (!destination || !destination.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required',
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required',
      });
    }

    if (!endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date is required',
      });
    }

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);

    if (isNaN(parsedStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format',
      });
    }

    if (isNaN(parsedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format',
      });
    }

    if (parsedEnd < parsedStart) {
      return res.status(400).json({
        success: false,
        message: 'End date cannot be earlier than start date',
      });
    }

    // Create and persist new trip in MongoDB
    const trip = await Trip.create({
      name: name.trim(),
      destination: destination.trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      description: description ? description.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      trip,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }
    next(error);
  }
};
