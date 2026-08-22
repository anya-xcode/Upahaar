import { ApiError } from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  let error = err;

  // Translate Mongoose noise into something a customer could actually read.
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, details[0] || 'Please check the details you entered', details);
  } else if (err.name === 'CastError') {
    error = new ApiError(400, `Invalid ${err.path}`);
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    error = new ApiError(409, `That ${field} is already registered`);
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: statusCode === 500 ? 'Something went wrong on our side' : error.message,
  };
  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    payload.message = error.message;
    payload.stack = error.stack;
  }

  // A 500 is ours to fix, so it is logged with the original error and the id the
  // customer can quote. A 4xx is the caller's mistake and already visible in the
  // request line — logging it again would just be noise.
  if (statusCode === 500) {
    (req.log || logger).error('Unhandled error', { err, method: req.method, path: req.originalUrl });
    // The id is on the response headers already; naming it here makes it
    // quotable from an error toast as well.
    if (req.id) payload.requestId = req.id;
  }

  res.status(statusCode).json(payload);
}
