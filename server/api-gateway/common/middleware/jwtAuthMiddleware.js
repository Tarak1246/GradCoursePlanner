const passport = require("../config/passport");
const logger = require("../utils/logger");

const skipAuthRoutes = [
  { method: "GET", path: "/healthcheck" },
  { method: "POST", path: "/api/auth/signin" },
  { method: "POST", path: "/api/auth/signup" },
  { method: "POST", path: "/api/auth/register-admin" },
];

// Middleware to apply JWT authentication
const jwtAuthMiddleware = (req, res, next) => {
  console.log(`[Request Received] Method: ${req.method}, path: ${req.path}`);
  const isExcluded = skipAuthRoutes.some(
    (route) => route.method === req.method && route.path === req.path
  );

  if (isExcluded) {
    logger.info(`Skipping authentication for route: ${req.method} ${req.path}`);
    return next();
  }

  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      logger.error(
        `Authentication error for route: ${req.method} ${req.path}`,
        err
      );
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      logger.warn(`Unauthorized access to route: ${req.method} ${req.path}`);
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user info to the request
    req.user = user;
    req.headers["x-user-id"] = user._id.toString(); // Pass user ID in headers
    req.headers["x-user-email"] = user.email; // Optional: Pass other user fields
    req.headers["x-user-role"] = user.role; // Optional: Pass other user fields
    logger.info(`Authentication successful for user ID: ${user._id}`);
    next();
  })(req, res, next);
};

module.exports = jwtAuthMiddleware;
