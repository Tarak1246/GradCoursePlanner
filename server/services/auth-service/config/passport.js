const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

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
                if (!user) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
                if (!isPasswordValid) {
                    return done(null, false, { message: 'Invalid email or password' });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);



// JWT Strategy for protected routes
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
    try {
        const user = await User.findById(payload.id);
        if (!user) return done(null, false);
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

