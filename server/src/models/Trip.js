import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Participant name is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  role: {
    type: String,
    enum: ['organizer', 'member'],
    default: 'member',
  },
  status: {
    type: String,
    enum: ['confirmed', 'invited'],
    default: 'confirmed',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const tripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (value) {
          if (!this.startDate || !value) return true;
          return new Date(value) >= new Date(this.startDate);
        },
        message: 'End date cannot be earlier than start date',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    participants: [participantSchema],
  },
  {
    timestamps: true,
  }
);

// Helper function to generate a random 6-character alphanumeric uppercase invite code
export function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TRIP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Auto-assign inviteCode before saving if not present
tripSchema.pre('save', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
  next();
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
