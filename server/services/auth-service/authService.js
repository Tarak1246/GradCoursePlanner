const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
require('dotenv').config();
require('./config/passport');

const app = express();
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.get('/', async (req, res) => {
    try {
      res.send('Auth service is running...');
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);
// Middleware to handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({
        message: 'The requested resource was not found',
        path: req.originalUrl
    });
});
// Middleware to handle 404 errors
app.use((req, res, next) => {
    res.status(404).json({
        message: 'The requested resource was not found',
        path: req.originalUrl
    });
});

// Global error handling
process.on("unhandledRejection", (reason, promise) => {
console.error("Unhandled Rejection at:", promise, "reason:", reason);
// Additional error handling logic
});
process.on("uncaughtException", (error) => {
console.error("Uncaught Exception:", error.message);
// Additional error handling logic
process.exit(1); // Exit the process to prevent it from running indefinitely
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Auth Service running on port ${PORT}`));
