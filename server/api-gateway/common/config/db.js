//Database connection logic
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // Shared logger

const connectDB = async (MONGO_URI) => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('Database connection failed:', error);
        process.exit(1); // Exit on failure
    }
};

module.exports = connectDB;

