const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Log error to database
  if (req.user) {
    pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'ERROR_OCCURRED', err.message]
    ).catch(console.error);
  }

  // Production error handling
  if (process.env.NODE_ENV === 'production') {
    // Don't leak sensitive information
    const safeError = {
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    
    res.status(err.statusCode || 500).json({
      error: safeError.message,
      success: false
    });
  } else {
    // Development error handling
    res.status(err.statusCode || 500).json({
      error: err.message,
      stack: err.stack,
      success: false
    });
  }
};

module.exports = errorHandler;
