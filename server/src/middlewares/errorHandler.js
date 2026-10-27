/**
 * Centralized error handler middleware.
 * Formats errors into a consistent JSON response.
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  console.error(`[Error] ${req.method} ${req.url} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Include stack trace only in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
