import mongoose from 'mongoose';

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
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
