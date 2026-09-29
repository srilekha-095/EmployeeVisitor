const Visitor = require('../models/Visitor');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError, ForbiddenError } = require('../errors');
const catchAsync = require('../utils/catchAsync');

// Fields every role may write
const COMMON_FIELDS = [
  'name',
  'mobile',
  'email',
  'organization',
  'personToMeet',
  'purpose',
  'visitDateTime',
];
// Fields only employees (reception staff) may write
const EMPLOYEE_FIELDS = [...COMMON_FIELDS, 'status'];

const isEmployee = (req) => req.user.role === 'employee';

const pickFields = (body, allowed) =>
  allowed.reduce((acc, key) => {
    if (body[key] !== undefined) acc[key] = body[key];
    return acc;
  }, {});

// Employees see everything; visitors/students only see records they created
const scopeFilter = (req) => (isEmployee(req) ? {} : { createdBy: req.user.userId });

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Finds a record inside the caller's scope; someone else's record looks like "not found"
const findScoped = async (req) => {
  const { id } = req.params;
  const visitor = await Visitor.findOne({ _id: id, ...scopeFilter(req) });
  if (!visitor) throw new NotFoundError(`No visitor found with id: ${id}`);
  return visitor;
};

// POST /api/v1/visitors
const createVisitor = catchAsync(async (req, res) => {
  const data = pickFields(req.body, isEmployee(req) ? EMPLOYEE_FIELDS : COMMON_FIELDS);
  data.createdBy = req.user.userId;
  if (!isEmployee(req)) data.status = 'Checked In';
  if (data.status === 'Checked Out') data.checkOutTime = new Date();

  const visitor = await Visitor.create(data);
  res.status(StatusCodes.CREATED).json({ visitor });
});

// GET /api/v1/visitors?search=&status=&page=&limit=
const getAllVisitors = catchAsync(async (req, res) => {
  const { search, status, page = 1, limit = 10 } = req.query;

  const queryObject = { ...scopeFilter(req) };

  if (status && ['Checked In', 'Checked Out'].includes(status)) {
    queryObject.status = status;
  }

  // Search by visitor name or mobile number
  if (typeof search === 'string' && search.trim()) {
    const term = escapeRegex(search.trim());
    queryObject.$or = [
      { name: { $regex: term, $options: 'i' } },
      { mobile: { $regex: term } },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const totalVisitors = await Visitor.countDocuments(queryObject);
  const visitors = await Visitor.find(queryObject)
    .populate('createdBy', 'name role')
    .sort('-visitDateTime')
    .skip(skip)
    .limit(limitNum);

  res.status(StatusCodes.OK).json({
    visitors,
    count: visitors.length,
    totalVisitors,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(totalVisitors / limitNum) || 1,
  });
});

// GET /api/v1/visitors/stats   (scoped: employees see all, others see their own)
const getStats = catchAsync(async (req, res) => {
  const scope = scopeFilter(req);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, today, checkedIn, checkedOut] = await Promise.all([
    Visitor.countDocuments(scope),
    Visitor.countDocuments({ ...scope, visitDateTime: { $gte: startOfDay } }),
    Visitor.countDocuments({ ...scope, status: 'Checked In' }),
    Visitor.countDocuments({ ...scope, status: 'Checked Out' }),
  ]);

  res.status(StatusCodes.OK).json({ total, today, checkedIn, checkedOut });
});

// GET /api/v1/visitors/:id
const getSingleVisitor = catchAsync(async (req, res) => {
  const visitor = await findScoped(req);
  res.status(StatusCodes.OK).json({ visitor });
});

// PATCH /api/v1/visitors/:id
const updateVisitor = catchAsync(async (req, res) => {
  const visitor = await findScoped(req);

  if (!isEmployee(req) && visitor.status === 'Checked Out') {
    throw new ForbiddenError('A checked-out visit can only be edited by an employee');
  }

  const data = pickFields(req.body, isEmployee(req) ? EMPLOYEE_FIELDS : COMMON_FIELDS);
  const previousStatus = visitor.status;
  visitor.set(data);

  // Maintain check-out time automatically when the status changes
  if (visitor.status === 'Checked Out' && previousStatus !== 'Checked Out') {
    visitor.checkOutTime = new Date();
  } else if (visitor.status === 'Checked In') {
    visitor.checkOutTime = null;
  }

  await visitor.save(); // runs schema validators on the modified fields
  res.status(StatusCodes.OK).json({ visitor });
});

// DELETE /api/v1/visitors/:id   (employees only, enforced in the route)
const deleteVisitor = catchAsync(async (req, res) => {
  const { id } = req.params;
  const visitor = await Visitor.findByIdAndDelete(id);

  if (!visitor) {
    throw new NotFoundError(`No visitor found with id: ${id}`);
  }

  res.status(StatusCodes.OK).json({ msg: 'Visitor deleted successfully' });
});

module.exports = {
  createVisitor,
  getAllVisitors,
  getStats,
  getSingleVisitor,
  updateVisitor,
  deleteVisitor,
};
