const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { signup, signin } = require('../controllers/authController');
const router = express.Router();
// Configure rate limiter
const signinLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { message: 'Too many login attempts, please try again after 15 minutes' }
});
// Signup Route
router.post('/signup', signup);
// Signin Route
router.post('/signin', signinLimiter, (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            logger.error('Authentication error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (!user) {
            return res.status(401).json({ message: info.message || 'Authentication failed' });
        }

        req.user = user;
        next();
    })(req, res, next);
}, signin);

module.exports = router;
