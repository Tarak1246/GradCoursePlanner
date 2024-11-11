const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
};
