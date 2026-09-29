const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthenticatedError, ForbiddenError } = require('../errors');
const catchAsync = require('../utils/catchAsync');

// Verifies the Bearer token and attaches { userId, name, role } to req.user
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication required');
  }

  let payload;
  try {
    payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    throw new UnauthenticatedError('Invalid or expired token, please log in again');
  }

  // Load the user so deleted accounts / changed roles take effect immediately
  const user = await User.findById(payload.userId).select('name role');
  if (!user) {
    throw new UnauthenticatedError('This account no longer exists');
  }

  req.user = { userId: user._id.toString(), name: user.name, role: user.role };
  next();
});

// Restricts a route to the listed roles, e.g. authorizeRoles('employee')
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ForbiddenError('You do not have permission to perform this action'));
  }
  next();
};

module.exports = { authenticate, authorizeRoles };
