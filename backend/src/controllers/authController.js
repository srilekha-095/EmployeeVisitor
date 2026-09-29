const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const { BadRequestError, UnauthenticatedError, ForbiddenError } = require('../errors');
const catchAsync = require('../utils/catchAsync');

const createToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME || '1d',
  });

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile,
  role: user.role,
  organization: user.organization,
});

const isString = (v) => typeof v === 'string';

// POST /api/v1/auth/register
const register = catchAsync(async (req, res) => {
  const { name, email, mobile, password, role, organization, employeeCode } = req.body;

  // Type checks also block NoSQL-injection style payloads such as { "$ne": null }
  if (![name, email, mobile, password, role].every(isString) ||
      ![name, email, mobile, password, role].every((v) => v.trim())) {
    throw new BadRequestError('Please provide name, email, mobile, password and role');
  }
  if (!User.ROLES.includes(role)) {
    throw new BadRequestError('Role must be employee, visitor or student');
  }
  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }

  // Employees get full access, so signup is gated by a company access code
  if (role === 'employee') {
    const expected = process.env.EMPLOYEE_SIGNUP_CODE;
    if (!expected) {
      throw new ForbiddenError('Employee signup is currently disabled');
    }
    if (!isString(employeeCode) || employeeCode !== expected) {
      throw new ForbiddenError('Invalid employee access code');
    }
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    mobile,
    password: hashed,
    role,
    organization: role === 'employee' ? undefined : isString(organization) ? organization : undefined,
  });

  res.status(StatusCodes.CREATED).json({ user: publicUser(user), token: createToken(user) });
});

// POST /api/v1/auth/login
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!isString(email) || !isString(password) || !email.trim() || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  res.status(StatusCodes.OK).json({ user: publicUser(user), token: createToken(user) });
});

module.exports = { register, login };
