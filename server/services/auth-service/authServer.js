const express = require('express');
const passport = require('../../api-gateway/common/config/passport');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('../../api-gateway/common/middleware/errorHandler');
const logger = require('../../api-gateway/common/utils/logger');
const connectDB = require('../../api-gateway/common/config/db');
const fileUpload = require('express-fileupload');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(passport.initialize());
app.use(cors({
    origin: ['http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

connectDB(process.env.MONGO_URI);
app.use('/', authRoutes);

// Middleware to handle 404 errors
app.use((req, res) => {
    logger.warn(`404 Error - Resource not found at path: ${req.originalUrl}`);
    res.status(404).json({
        message: 'The requested resource was not found',
        path: req.originalUrl,
    });
});

// Error handling middleware
app.use(errorHandler);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
});
