const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const axios = require('axios');
const logger = require('./common/utils/logger');
const connectDB = require('./common/config/db');
dotenv.config();
require('./common/config/passport');

const app = express();
// app.use(express.json());
app.use(cors());

// Connect to the database
connectDB(process.env.MONGO_URI);

app.use((req, res, next) => {
    logger.info(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// Root Route
app.get('/', async (req, res) => {
    try {
        res.send('API Gateway is running...');
        logger.info('API Gateway root endpoint accessed');
    } catch (error) {
        logger.error(`Error accessing root endpoint: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Route: Aggregate Subject Details from Multiple Microservices
app.post('/api/subject-details', async (req, res) => {
    const { subjectId } = req.body;
    if (!subjectId) {
        logger.warn("Subject ID not provided");
        return res.status(400).json({ message: "Subject ID is required" });
    }

    logger.info(`Received request for subject details: ${subjectId}`);

    try {
        // URLs of microservices
        const prerequisiteCheckerUrl = `http://localhost:5001/api/prerequisites/${subjectId}`;
        const courseCheckerUrl = `http://localhost:5002/api/course-check/${subjectId}`;
        const certificateCheckerUrl = `http://localhost:5003/api/certificates/${subjectId}`;

        // Call microservices in parallel
        const [prerequisiteResponse, courseResponse, certificateResponse] = await Promise.all([
            axios.get(prerequisiteCheckerUrl),
            axios.get(courseCheckerUrl),
            axios.get(certificateCheckerUrl),
        ]);

        logger.info("Successfully fetched responses from all microservices");

        // Consolidate responses
        const consolidatedResponse = {
            prerequisites: prerequisiteResponse.data, // Data from Prerequisite Checker
            courseCheck: courseResponse.data, // Data from Course Checker
            certificateEligibility: certificateResponse.data, // Data from Certificate Checker
        };

        res.status(200).json(consolidatedResponse);
    } catch (error) {
        logger.error("Error while fetching subject details", { error: error.message });

        if (axios.isAxiosError(error)) {
            const errorResponse = error.response ? error.response.data : "Service unreachable";
            return res.status(502).json({ message: "Error from one or more services", details: errorResponse });
        }

        res.status(500).json({ message: "Internal server error", details: error.message });
    }
});

// Auth-Service Proxy
app.use(
    '/api/auth',
    createProxyMiddleware({
        target: 'http://localhost:5000', // Auth-Service base URL
        changeOrigin: true,
        pathRewrite: { '^/api/auth': '/api/auth' }, // Maintain the same path structure
        logLevel: 'debug',
        on: {
            proxyReq: fixRequestBody, // Fix POST request body issues
        },
        onProxyReq: (proxyReq, req) => {
            logger.info(`[Proxy] Forwarding request to Auth Service: ${req.method} ${req.originalUrl}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            logger.info(`[Proxy] Response received from Auth Service: ${req.method} ${req.originalUrl}`);
        },
        onError: (err, req, res) => {
            logger.error(`[Proxy] Error connecting to Auth Service: ${err.message}`);
            res.status(502).json({ message: 'Error connecting to Auth Service' });
        },
    })
);

// Course-Checker Service Proxy
app.use(
    '/api/courses',
    createProxyMiddleware({
        target: 'http://localhost:5002', // Course Checker Service base URL
        changeOrigin: true,
        pathRewrite: { '^/api/courses': '/api/courses' }, // Keep `/api/courses` structure
        logLevel: 'debug',
        on: {
            proxyReq: fixRequestBody,
        },
        onProxyReq: (proxyReq, req) => {
            logger.info(`[Proxy] Forwarding request to Course Checker Service: ${req.method} ${req.originalUrl}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            logger.info(`[Proxy] Response received from Course Checker Service: ${req.method} ${req.originalUrl}`);
        },
        onError: (err, req, res) => {
            logger.error(`[Proxy] Error connecting to Course Checker Service: ${err.message}`);
            res.status(502).json({ message: 'Error connecting to Course Checker Service' });
        },
    })
);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
});
