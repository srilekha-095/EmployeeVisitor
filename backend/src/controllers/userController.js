const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { UnauthenticatedError } = require('../errors');
const catchAsync = require('../utils/catchAsync');

// GET /api/v1/users/me
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) throw new UnauthenticatedError('This account no longer exists');
  res.status(StatusCodes.OK).json({ user });
});

// GET /api/v1/users/employees  -> names only, used for the "Person to Meet" suggestions
const getEmployees = catchAsync(async (req, res) => {
  const employees = await User.find({ role: 'employee' }).select('name').sort('name');
  res.status(StatusCodes.OK).json({ employees });
});

module.exports = { getMe, getEmployees };
