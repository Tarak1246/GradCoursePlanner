const express = require('express');
const passport = require('passport');
const { addOrModifyCourses } = require('../controllers/courseController');
const { verifyAdmin } = require('../middlewares/verifyAdmin');
const {bulkUploadRateLimiter} = require('../middlewares/rateLimiter');
const logger = require('../../../common/utils/logger');

const router = express.Router();

// Route for Bulk Add or Modify Courses
router.post(
    '/bulk',
    (req, res, next) => {
        logger.info(`Incoming request to /api/courses/bulk from IP: ${req.ip}`);
        next();
    },
    passport.authenticate('jwt', { session: false }),
    (err, req, res, next) => {
        if (err.name === 'UnauthorizedError') {
            logger.warn(`Unauthorized access attempt to /api/courses/bulk by IP: ${req.ip}`);
            return res.status(401).json({ message: 'Invalid or missing token.' });
        }
        next(err);
    },
    verifyAdmin,
    bulkUploadRateLimiter,
    addOrModifyCourses
);

module.exports = router;
