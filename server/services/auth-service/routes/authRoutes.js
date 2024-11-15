const express = require('express');
const passport = require('../../../api-gateway/common/config/passport');
const logger = require('../../../api-gateway/common/utils/logger');
const { signup, signin, registerAdmin } = require('../controllers/authController');
const {loginRateLimiter} = require('../../../api-gateway/common/middleware/rateLimiter');
const router = express.Router();

router.post('/signup', loginRateLimiter, async (req, res, next) => {
    console.log("called");
    try {
        logger.info('Signup endpoint hit');
        await signup(req, res, next);
    } catch (error) {
        logger.error(`Error in signup route: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/signin', loginRateLimiter, (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            logger.error(`Authentication error: ${err.message}`);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!user) {
            logger.warn(`Authentication failed: ${info?.message || 'No user found'}`);
            return res.status(401).json({ message: info?.message || 'Authentication failed' });
        }

        logger.info(`User authenticated: ${user.email}`);
        req.user = user; // Attach user to request
        next();
    })(req, res, next);
}, async (req, res, next) => {
    try {
        await signin(req, res, next);
    } catch (error) {
        logger.error(`Error in signin route: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Register Admin Route
router.post('/register-admin', async (req, res, next) => {
    try {
        logger.info('Register Admin endpoint hit');
        await registerAdmin(req, res, next);
    } catch (error) {
        logger.error(`Error in register-admin route: ${error.message}`);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
