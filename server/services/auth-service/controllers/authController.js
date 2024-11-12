const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
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
            return res.status(400).json({ message: 'Email must end with @wright.edu' });
        }

        // Validate password strength
        if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, numbers, and symbols' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            logger.warn(`Signup failed - Email ${email} already exists`);
            return res.status(409).json({ message: 'Email already exists' });
        }

        // Create new user
        const newUser = new User({
            name,
            email,
            passwordHash: password, // Will be hashed automatically
            role,
            programOfStudy: [],
            coursesTaken: []
        });

        await newUser.save();
        logger.info(`User ${email} registered successfully`);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        if (error.name === 'ValidationError') {
            // Handle Mongoose validation errors
            const errorMessage = Object.values(error.errors)
                .map(err => err.message)
                .join(', ');
            logger.error(`Validation error during signup: ${errorMessage}`);
            return res.status(400).json({ message: errorMessage });
        }

        logger.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
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
        res.status(200).json({
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
        res.status(500).json({ message: 'Internal server error' });
    }
};

//registerAdmin
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password, adminKey } = req.body;

        // Verify admin key
        if (adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({ message: 'Invalid admin key. Access denied.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
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
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        logger.error('Register admin error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
