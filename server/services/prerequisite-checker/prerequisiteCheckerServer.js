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

// Error handling middleware
app.use(errorHandler);
app.use((req, res, next) => {
    const userId = req.headers["x-user-id"];
    const userEmail = req.headers["x-user-email"];
    const role = req.headers["x-user-role"];
    if (!userId) {
      return res
        .status(401)
        .json({ message: "User information missing in request" });
    }
  
    req.user = { id: userId, email: userEmail, role: role }; // Attach user info to req.user
    next();
  });

// Routes
app.use('/', prerequisiteRoutes);
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

