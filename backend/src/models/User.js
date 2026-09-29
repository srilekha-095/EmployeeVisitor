const mongoose = require('mongoose');

const ROLES = ['employee', 'visitor', 'student'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'],
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: { values: ROLES, message: 'Role must be employee, visitor or student' },
      required: [true, 'Role is required'],
    },
    // Company (visitor) or college (student). Not needed for employees.
    organization: {
      type: String,
      trim: true,
      required: [
        function () {
          return this.role !== 'employee';
        },
        'Organization / College name is required',
      ],
    },
  },
  { timestamps: true }
);

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
