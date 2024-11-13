const express = require('express');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('../../common/utils/logger');
const connectDB = require('../../common/config/db');
require('dotenv').config();
require('./config/passport');

const app = express();
app.use(express.json());
const fileUpload = require('express-fileupload');
app.use(fileUpload());

// Initialize shared DB connection
connectDB()

// Routes
app.get('/', async (req, res) => {
    try {
        res.send('Auth service is running...');
        logger.info('Root endpoint accessed successfully');
    } catch (error) {
        logger.error(`Error accessing root endpoint: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Course management routes
app.use('/api/courses', courseRoutes);

// Error handling middleware
app.use(errorHandler);

// Middleware to handle 404 errors
app.use((req, res) => {
    logger.warn(`404 Error - Resource not found at path: ${req.originalUrl}`);
    res.status(404).json({
        message: 'The requested resource was not found',
        path: req.originalUrl,
    });
});

// Middleware to handle unauthorized errors
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        logger.warn('401 Unauthorized - Invalid or missing token');
        res.status(401).json({ message: 'Invalid or missing token.' });
    } else {
        next(err);
    }
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1); // Exit the process to prevent it from running indefinitely
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
});
