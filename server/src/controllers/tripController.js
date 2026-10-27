import Trip, { generateInviteCode } from '../models/Trip.js';

/**
 * @desc    Create a new trip
 * @route   POST /api/trips
 * @access  Public
 */
export const createTrip = async (req, res, next) => {
  try {
    const {
      name,
      destination,
      startDate,
      endDate,
      description,
      organizerName,
      organizerEmail,
    } = req.body;

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

    // Attach initial organizer participant if provided
    const participants = [];
    if (organizerName && organizerName.trim()) {
      participants.push({
        name: organizerName.trim(),
        email: organizerEmail ? organizerEmail.trim().toLowerCase() : '',
        role: 'organizer',
        status: 'confirmed',
      });
    }

    // Create and persist new trip in MongoDB
    const trip = await Trip.create({
      name: name.trim(),
      destination: destination.trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      description: description ? description.trim() : '',
      inviteCode: generateInviteCode(),
      participants,
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

/**
 * @desc    Get all trips with participant count
 * @route   GET /api/trips
 * @access  Public
 */
export const getAllTrips = async (req, res, next) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });

    const enrichedTrips = trips.map((trip) => ({
      ...trip.toObject(),
      participantCount: trip.participants?.length || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedTrips.length,
      trips: enrichedTrips,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single trip by ID with participants
 * @route   GET /api/trips/:id
 * @access  Public
 */
export const getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // Ensure inviteCode is generated if legacy record lacks one
    if (!trip.inviteCode) {
      trip.inviteCode = generateInviteCode();
      await trip.save();
    }

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Add a participant to a trip
 * @route   POST /api/trips/:id/participants
 * @access  Public
 */
export const addParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Participant name is required',
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const trimmedName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Check for duplicate participant name or email
    const duplicate = trip.participants.find(
      (p) =>
        p.name.toLowerCase() === trimmedName.toLowerCase() ||
        (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail)
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Participant "${trimmedName}" is already in this trip`,
      });
    }

    const newParticipant = {
      name: trimmedName,
      email: cleanEmail,
      role: role && ['organizer', 'member'].includes(role) ? role : 'member',
      status: status && ['confirmed', 'invited'].includes(status) ? status : 'confirmed',
      joinedAt: new Date(),
    };

    trip.participants.push(newParticipant);
    await trip.save();

    const added = trip.participants[trip.participants.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Participant added successfully',
      participant: added,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a participant from a trip
 * @route   DELETE /api/trips/:id/participants/:participantId
 * @access  Public
 */
export const removeParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const participantExists = trip.participants.id(participantId);
    if (!participantExists) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this trip',
      });
    }

    trip.participants.pull(participantId);
    await trip.save();

    return res.status(200).json({
      success: true,
      message: `Participant "${participantExists.name}" removed successfully`,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Invite a participant to a trip (adds as invited and returns link info)
 * @route   POST /api/trips/:id/invite
 * @access  Public
 */
export const inviteParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, name, role } = req.body;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    if (!trip.inviteCode) {
      trip.inviteCode = generateInviteCode();
      await trip.save();
    }

    let invitedParticipant = null;

    if (name && name.trim()) {
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      const existing = trip.participants.find(
        (p) =>
          p.name.toLowerCase() === name.trim().toLowerCase() ||
          (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail)
      );

      if (!existing) {
        invitedParticipant = {
          name: name.trim(),
          email: cleanEmail,
          role: role || 'member',
          status: 'invited',
          joinedAt: new Date(),
        };
        trip.participants.push(invitedParticipant);
        await trip.save();
        invitedParticipant = trip.participants[trip.participants.length - 1];
      } else {
        invitedParticipant = existing;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Invitation details generated successfully',
      inviteCode: trip.inviteCode,
      tripName: trip.name,
      participant: invitedParticipant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Join a trip using an invite code
 * @route   POST /api/trips/join
 * @access  Public
 */
export const joinTripByCode = async (req, res, next) => {
  try {
    const { inviteCode, name, email } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Trip invite code is required',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Your name is required to join',
      });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const trip = await Trip.findOne({ inviteCode: cleanCode });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: `No trip found with invite code "${cleanCode}"`,
      });
    }

    const trimmedName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Check if already in the trip
    let participant = trip.participants.find(
      (p) =>
        p.name.toLowerCase() === trimmedName.toLowerCase() ||
        (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail)
    );

    if (participant) {
      // If was previously 'invited', confirm them
      if (participant.status === 'invited') {
        participant.status = 'confirmed';
        await trip.save();
      }
    } else {
      trip.participants.push({
        name: trimmedName,
        email: cleanEmail,
        role: 'member',
        status: 'confirmed',
        joinedAt: new Date(),
      });
      await trip.save();
      participant = trip.participants[trip.participants.length - 1];
    }

    return res.status(200).json({
      success: true,
      message: `Successfully joined "${trip.name}"!`,
      tripId: trip._id,
      trip,
      participant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trip preview by invite code
 * @route   GET /api/trips/invite/:inviteCode
 * @access  Public
 */
export const getTripByInviteCode = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    const cleanCode = inviteCode.trim().toUpperCase();
    const trip = await Trip.findOne({ inviteCode: cleanCode });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invite code',
      });
    }

    return res.status(200).json({
      success: true,
      trip: {
        _id: trip._id,
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        description: trip.description,
        participantCount: trip.participants.length,
        inviteCode: trip.inviteCode,
      },
    });
  } catch (error) {
    next(error);
  }
};
