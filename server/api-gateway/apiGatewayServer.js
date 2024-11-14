const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const logger = require('./common/utils/logger');
const connectDB = require('./common/config/db');
dotenv.config();
require('./common/config/passport');
const app = express();
// app.use(express.json());
app.use(cors());

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

app.use(
    '/api/auth',
    createProxyMiddleware({
        target: 'http://localhost:5000', // Auth-Service base URL
        changeOrigin: true,
        pathRewrite: { '^/api/auth': '/api/auth' }, // Maintain the same path structure
        logLevel: 'debug', // Enable debug logs
        on: {
            proxyReq: fixRequestBody, // Fix POST request body issues
        },
        onProxyReq: (proxyReq, req) => {
            logger.info(`[Proxy] Forwarding request: ${req.method} ${req.originalUrl}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            logger.info(`[Proxy] Response received: ${req.method} ${req.originalUrl}`);
        },
        onError: (err, req, res) => {
            logger.error(`[Proxy] Error connecting to Auth-Service: ${err.message}`);
            res.status(502).json({ message: 'Error connecting to Auth-Service' });
        },
    })
);


app.use(
    '/api/courses',
    createProxyMiddleware({
        target: 'http://localhost:5002', // course checker Service base URL
        changeOrigin: true,
        pathRewrite: { '^/api/courses': '/api/courses' }, // Keep `/api/courses` structure
        logLevel: 'debug', // Enable debug logs
        on: {
            proxyReq: fixRequestBody, // Fix POST request body issues
        },
        onProxyReq: (proxyReq, req) => {
            logger.info(`[Proxy] Forwarding request: ${req.method} ${req.originalUrl}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            logger.info(`[Proxy] Response received: ${req.method} ${req.originalUrl}`);
        },
        onError: (err, req, res) => {
            logger.error(`[Proxy] Error connecting to Course Service: ${err.message}`);
            res.status(502).json({ message: 'Error connecting to Course Service' });
        },
    })
);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    logger.info(`API Gateway running on port ${PORT}`);
});
