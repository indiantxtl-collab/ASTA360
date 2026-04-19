const rateLimit = require('express-rate-limit');

// Different rate limits based on user role
const createRateLimiter = (windowMs, maxRequests, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use IP address as key, but allow override for authenticated users
      if (req.user) {
        return req.user.id;
      }
      return req.ip;
    }
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  auth: createRateLimiter(15 * 60 * 1000, 5), // 5 attempts per 15 minutes for auth
  api: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes for API
  ai: createRateLimiter(60 * 1000, 10), // 10 AI requests per minute
  bulk: createRateLimiter(60 * 1000, 5) // 5 bulk operations per minute
};

module.exports = rateLimiters;
