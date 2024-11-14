const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();
const logger = require('../utils/logger');

// Local Strategy for login
passport.use(
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ email });
                logger.info(`Login attempt for email: ${email}`);
                if (!user) {
                    logger.warn(`Login failed for email: ${email} - User not found`);
                    // Introduce dummy compare to mitigate timing attacks
                    await bcrypt.compare(password, '$2b$10$invalidSaltValue00000000000000000000000000');
                    return done(null, false, { message: 'Invalid email or password' });
                }

                const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
                if (!isPasswordValid) {
                    logger.warn(`Login failed for email: ${email} - Invalid password`);
                    return done(null, false, { message: 'Invalid email or password' });
                }
                logger.info(`Login successful for email: ${email}`);
                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET
        },
        async (payload, done) => {
            try {
                const user = await User.findById(payload.id);
                logger.info(`Token validation attempt for user ID: ${payload.id}`);

                if (!user) {
                    logger.warn(`Token validation failed - User not found: ${payload.id}`);
                    return done(null, false, { message: 'User not found' });
                }
                logger.info(`Token validation successful for user ID: ${payload.id}`);
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

module.exports = passport;