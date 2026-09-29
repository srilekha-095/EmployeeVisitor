const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    organization: {
      type: String,
      required: [true, 'Organization / College name is required'],
      trim: true,
    },
    personToMeet: {
      type: String,
      required: [true, 'Person to meet is required'],
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      trim: true,
      maxlength: [300, 'Purpose cannot exceed 300 characters'],
    },
    visitDateTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['Checked In', 'Checked Out'],
        message: 'Status must be either "Checked In" or "Checked Out"',
      },
      default: 'Checked In',
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    // The account that created this record (employee for walk-ins, or the visitor/student themselves)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

visitorSchema.index({ name: 1 });
visitorSchema.index({ mobile: 1 });
visitorSchema.index({ visitDateTime: -1 });
visitorSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
