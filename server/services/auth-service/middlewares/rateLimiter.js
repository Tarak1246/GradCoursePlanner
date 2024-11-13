const rateLimit = require("express-rate-limit");

// Create a general-purpose rate limiter function
const createRateLimiter = (maxRequests, windowMinutes, message) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000, // Convert minutes to milliseconds
        max: maxRequests, // Limit each IP to maxRequests per window
        message: {
            message: message || "Too many requests, please try again later.",
        },
        standardHeaders: true, // Include `RateLimit-*` headers in the response
        legacyHeaders: false, // Disable `X-RateLimit-*` headers
    });
};

// Rate limiter for bulk uploads
const bulkUploadRateLimiter = createRateLimiter(
    10, // 10 requests
    15, // 15-minute window
    "Too many bulk upload attempts from this IP, please try again after 15 minutes."
);

// Rate limiter for login attempts
const loginRateLimiter = createRateLimiter(
    5, // 5 requests
    5, // 5-minute window
    "Too many login attempts, please try again after 5 minutes."
);

module.exports = { bulkUploadRateLimiter, loginRateLimiter };
