const express = require("express");
const courseRoutes = require("./routes/courseRoutes");
const errorHandler = require("../../api-gateway/common/middleware/errorHandler");
const logger = require("../../api-gateway/common/utils/logger");
const connectDB = require("../../api-gateway/common/config/db");
require("dotenv").config();
const passport = require('../../api-gateway/common/config/passport');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(passport.initialize());

app.use(cors({
  origin: ['http://localhost:4000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
// Initialize shared DB connection
connectDB(process.env.MONGO_URI);

// Error handling middleware
app.use(errorHandler);

// Attach Routes
app.use("/", courseRoutes);

// Global JWT Authentication Middleware
app.use((req, res, next) => {
  logger.info(`[Request Received] Method: ${req.method}, URL: ${req.url}`);
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err || !user) {
      logger.warn(`Unauthorized access attempt: ${info?.message || err?.message}`);
      return res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
    }
    req.user = user; // Attach the authenticated user to the request object
    next();
  })(req, res, next);
});

// Middleware to handle 404 errors
app.use((req, res) => {
  logger.warn(`404 Error - Resource not found at path: ${req.originalUrl}`);
  res.status(404).json({
    message: "The requested resource was not found",
    path: req.originalUrl,
  });
});

// Middleware to handle unauthorized errors
app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    logger.warn("401 Unauthorized - Invalid or missing token");
    res.status(401).json({ message: "Invalid or missing token." });
  } else {
    next(err);
  }
});

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1); // Exit the process to prevent it from running indefinitely
});

// Start server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () =>
  logger.info(`Course-Checker Service running on port ${PORT}`)
);
