const User = require('../../../api-gateway/common/models/User');
const jwt = require('jsonwebtoken');
const logger = require('../../../api-gateway/common/utils/logger');
const validator = require('validator');
require('dotenv').config();

// Signup
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if the email ends with "@wright.edu"
        const emailRegex = /^[a-zA-Z0-9._%+-]+@wright\.edu$/;
        if (!emailRegex.test(email)) {
            logger.warn(`Signup failed - Invalid email domain: ${email}`);
            return res.json({ status:400, message: 'Email must end with @wright.edu' });
        }

        // Validate password strength
        if (!validator.isStrongPassword(password, {
            minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1
        })) {
            logger.warn(`Signup failed - Weak password provided by ${email}`);
            return res.json({
                status:400,
                message: 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Signup failed - Email ${email} already exists`);
            return res.json({ status:409, message: 'Email already exists' });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            passwordHash: password, // Will be hashed automatically
            role: role || 'student', // Default role is 'student'
            programOfStudy: [],
            coursesTaken: []
        });

        await newUser.save();
        logger.info(`User ${email} registered successfully`);
        res.json({ status:201, message: 'User registered successfully' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            // Handle Mongoose validation errors
            const errorMessage = Object.values(error.errors)
                .map(err => err.message)
                .join(', ');
            logger.error(`Validation error during signup: ${errorMessage}`);
            return res.json({status:400, message: errorMessage });
        }

        logger.error('Signup error:', error);
        res.json({ status:500,message: 'Internal server error' });
    }
};

// Signin
exports.signin = async (req, res) => {
    try {
        const user = req.user;

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Include role in the payload for authorization purposes
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        logger.info(`User ${user.email} signed in successfully`);
        res.json({
            status:200,
            message: 'Signin successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Signin error:', error);
        res.json({ status:500, message: 'Internal server error' });
    }
};

// Register Admin
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            logger.warn(`Register admin failed - Invalid admin key provided for email: ${email}`);
            return res.json({ status:403, message: 'Invalid admin key. Access denied.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Register admin failed - Email ${email} already exists`);
            return res.json({ status:409, message: 'Email already exists' });
        }

        // Create admin user
        const newAdmin = new User({
            name,
            email,
            passwordHash: password, // Password will be hashed automatically in the model
            role: 'admin', // Set role as 'admin'
        });

        await newAdmin.save();
        logger.info(`Admin user ${email} registered successfully`);
        res.json({ status:201, message: 'Admin registered successfully' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errorMessage = Object.values(error.errors)
                .map(err => err.message)
                .join(', ');
            logger.error(`Validation error during admin registration: ${errorMessage}`);
            return res.json({ status:400, message: errorMessage });
        }

        logger.error('Register admin error:', error);
        res.json({ status:500, message: 'Internal server error' });
    }
};
