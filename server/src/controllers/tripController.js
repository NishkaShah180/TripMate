import mongoose from 'mongoose';
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

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

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
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Update an existing trip
 * @route   PUT /api/trips/:id
 * @access  Public
 */
export const updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

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

    // Update only permitted fields to preserve participants and inviteCode
    trip.name = name.trim();
    trip.destination = destination.trim();
    trip.startDate = parsedStart;
    trip.endDate = parsedEnd;
    if (description !== undefined) {
      trip.description = description ? description.trim() : '';
    }

    await trip.save();

    return res.status(200).json({
      success: true,
      message: 'Trip updated successfully',
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
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all participants for a specific trip
 * @route   GET /api/trips/:id/participants
 * @access  Public
 */
export const getTripParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const participants = trip.participants || [];
    const organizerCount = participants.filter((p) => p.role === 'organizer').length;
    const memberCount = participants.filter((p) => p.role === 'member').length;

    return res.status(200).json({
      success: true,
      count: participants.length,
      organizerCount,
      memberCount,
      participants,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a participant to a trip with MongoDB persistence
 * @route   POST /api/trips/:id/participants
 * @access  Public
 */
export const addParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const { name, email, role, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Participant name is required',
      });
    }

    const trimmedName = name.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // Validate email format if provided
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
      }
    }

    // Check for duplicate participant name or email
    const duplicate = trip.participants.find(
      (p) =>
        p.name.toLowerCase() === trimmedName.toLowerCase() ||
        (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail)
    );

    if (duplicate) {
      const field = duplicate.name.toLowerCase() === trimmedName.toLowerCase()
        ? `"${trimmedName}"`
        : `email "${cleanEmail}"`;
      return res.status(400).json({
        success: false,
        message: `Participant with ${field} is already in this trip`,
      });
    }

    const validatedRole = role && ['organizer', 'member'].includes(role) ? role : 'member';
    const validatedStatus = status && ['confirmed', 'invited'].includes(status) ? status : 'confirmed';

    const newParticipant = {
      name: trimmedName,
      email: cleanEmail,
      role: validatedRole,
      status: validatedStatus,
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
 * @desc    Update a participant's role or details
 * @route   PUT /api/trips/:id/participants/:participantId
 * @access  Public
 */
export const updateParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format',
      });
    }

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    const participant = trip.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this trip',
      });
    }

    const { role, name, email, status } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Participant name cannot be empty',
        });
      }
      participant.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format',
          });
        }
      }
      participant.email = cleanEmail;
    }

    if (role !== undefined) {
      if (!['organizer', 'member'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be either organizer or member',
        });
      }
      // If demoting from organizer to member, verify at least one other organizer remains
      if (participant.role === 'organizer' && role === 'member') {
        const remainingOrganizers = trip.participants.filter(
          (p) => p.role === 'organizer' && p._id.toString() !== participantId
        );
        if (remainingOrganizers.length === 0 && trip.participants.length > 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot demote the only organizer. Please assign another organizer first.',
          });
        }
      }
      participant.role = role;
    }

    if (status !== undefined) {
      if (!['confirmed', 'invited'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be either confirmed or invited',
        });
      }
      participant.status = status;
    }

    await trip.save();

    return res.status(200).json({
      success: true,
      message: 'Participant updated successfully',
      participant,
      trip,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a participant from a trip with MongoDB persistence
 * @route   DELETE /api/trips/:id/participants/:participantId
 * @access  Public
 */
export const removeParticipant = async (req, res, next) => {
  try {
    const { id, participantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid participant ID format',
      });
    }

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

    // Check if trying to remove the only organizer when other participants exist
    if (participantExists.role === 'organizer' && trip.participants.length > 1) {
      const remainingOrganizers = trip.participants.filter(
        (p) => p.role === 'organizer' && p._id.toString() !== participantId
      );
      if (remainingOrganizers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove the only organizer. Please assign another organizer first.',
        });
      }
    }

    const removedName = participantExists.name;
    trip.participants.pull(participantId);
    await trip.save();

    return res.status(200).json({
      success: true,
      message: `Participant "${removedName}" removed successfully`,
      removedParticipantId: participantId,
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trip ID format',
      });
    }

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
