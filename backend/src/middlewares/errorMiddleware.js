const { StatusCodes } = require('http-status-codes');

const errorMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, try again later',
  };

  // Mongoose validation error (e.g. missing/invalid fields)
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Duplicate key (e.g. email already registered)
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    customError.msg = `An account with this ${field} already exists`;
    customError.statusCode = StatusCodes.CONFLICT;
  }

  // Mongoose cast error (e.g. malformed MongoDB id)
  if (err.name === 'CastError') {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  // Don't leak internals for unexpected errors
  if (customError.statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
    console.error(err);
    customError.msg = 'Something went wrong, try again later';
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = errorMiddleware;
