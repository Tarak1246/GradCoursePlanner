const express = require('express');
const passport = require('passport');
const { signup, signin, registerAdmin } = require('../controllers/authController');
const router = express.Router();
const rateLimiter =  require('../middlewares/rateLimiter');
// Signup Route
router.post('/signup', rateLimiter, signup);
// Signin Route
router.post('/signin', rateLimiter, (req, res, next) => {
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
//register admin route
router.post('/register-admin', rateLimiter, registerAdmin);


module.exports = router;
