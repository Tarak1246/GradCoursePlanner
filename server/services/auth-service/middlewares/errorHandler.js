const logger = require('../../../common/utils/logger');

module.exports = (err, req, res, next) => {
    // Log error details
    logger.error(`Error occurred: ${err.message}`, {
        stack: err.stack,
        statusCode: err.status || 500,
        method: req.method,
        path: req.originalUrl,
    });

    // Send appropriate error response
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Include stack trace in development mode
    });
};
