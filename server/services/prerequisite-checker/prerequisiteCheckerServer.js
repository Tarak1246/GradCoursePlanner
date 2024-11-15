const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const logger = require('../../api-gateway/common/utils/logger');
const connectDB = require('../../api-gateway/common/config/db');
const errorHandler = require('../../api-gateway/common/middleware/errorHandler');
const prerequisiteRoutes = require('./routes/prerequisiteRoutes');
const passport = require('../../api-gateway/common/config/passport');
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Global JWT Authentication Middleware
app.use((req, res, next) => {
    console.log(`[Request Received] Method: ${req.method}, URL: ${req.url}`);
    if (
      req.path === "/healthcheck" || // Exclude healthcheck or public routes
      req.path.startsWith("/public")
    ) {
      return next();
    }
  
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      if (err || !user) {
        logger.warn(`Unauthorized access attempt: ${info?.message || err?.message}`);
        return res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
      }
      req.user = user; // Attach the authenticated user to the request object
      next();
    })(req, res, next);
  });


// Routes
app.use('/api/prerequisites', prerequisiteRoutes);

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
const startServer = async () => {
    try {
        // Database connection
        connectDB(process.env.MONGO_URI);
        // Start server
        const PORT = process.env.PORT || 5003;
        app.listen(PORT, () => {
            logger.info(`Prerequisite Checker Service running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Failed to connect to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

startServer();

