/**
 * Global Error Handler Middleware
 */

export function errorHandler(err, req, res, _next) {
  // Body parser errors (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ [API BodyParser Error]:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request payload: ' + err.message
    });
  }

  // General errors
  console.error(`❌ [Server Error] ${req.method} ${req.path}:`, err.message);
  console.error(err.stack);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error'
  });
}

/**
 * 404 Handler — must be registered after all routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export default { errorHandler, notFoundHandler };
