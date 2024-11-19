const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const {
  createProxyMiddleware,
  fixRequestBody,
} = require("http-proxy-middleware");
const axios = require("axios");
const logger = require("./common/utils/logger");
const connectDB = require("./common/config/db");
dotenv.config();
const passport = require("./common/config/passport");
const jwtAuthMiddleware = require("./common/middleware/jwtAuthMiddleware");

const app = express();
// app.use(express.json());
app.use(cors());
app.use(passport.initialize());
// Use JWT middleware globally
app.use(jwtAuthMiddleware);

app.use((req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// Root Route
app.get("/healthcheck", async (req, res) => {
  try {
    res.send("API Gateway is running...");
    logger.info("API Gateway root endpoint accessed");
  } catch (error) {
    logger.error(`Error accessing root endpoint: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// Route: Aggregate Subject Details from Multiple Microservices
app.get("/api/subject-details/:courseId", async (req, res) => {
  let { courseId } = req.params;
  if (!courseId) {
    logger.warn("Subject ID not provided");
    return res.status(400).json({ message: "Subject ID is required" });
  }

  logger.info(`Received request for subject details: ${courseId}`);

  try {
    // URLs of microservices
    const prerequisiteCheckerUrl = `http://localhost:5003/prerequisite-check/${courseId}`;
    const courseCheckerUrl = `http://localhost:5002/course-check/${courseId}`;
    const certificateCheckerUrl = `http://localhost:5001/certificate-check/${courseId}`;

    // Headers to forward
    const authHeaders = {
      Authorization: req.headers.authorization, // Forward the Bearer token
      "x-user-id": req.headers["x-user-id"],
      "x-user-email": req.headers["x-user-email"],
      "x-user-role": req.headers["x-user-role"],
    };

    // Call microservices in parallel
    const [prerequisiteResponse, courseResponse, certificateResponse] =
      await Promise.allSettled([
        axios.get(prerequisiteCheckerUrl, { headers: authHeaders }),
        axios.get(courseCheckerUrl, { headers: authHeaders }),
        axios.get(certificateCheckerUrl, { headers: authHeaders }),
      ]);

    const consolidatedResponse = {
      prerequisites:
        prerequisiteResponse.status === "fulfilled"
          ? prerequisiteResponse.value.data.data
          : null,
      courseCheck:
        courseResponse.status === "fulfilled" ? courseResponse.value.data.data : null,
      certificateEligibility:
        certificateResponse.status === "fulfilled"
          ? certificateResponse.value.data.data
          : null,
      errors: [
        prerequisiteResponse.status === "rejected"
          ? prerequisiteResponse.message
          : null,
        courseResponse.status === "rejected" ? courseResponse.message : null,
        certificateResponse.status === "rejected"
          ? certificateResponse.message
          : null,
      ].filter(Boolean),
    };

    logger.info("Successfully fetched responses from all microservices");
    return res.status(200).json(consolidatedResponse);
  } catch (error) {
    logger.error("Error while fetching subject details", {
      error: error.message,
    });

    if (axios.isAxiosError(error)) {
      const errorResponse = error.response
        ? error.response.data
        : "Service unreachable";
      return res.status(502).json({
        message: "Error from one or more services",
        details: errorResponse,
      });
    }

    res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
});

// Auth-Service Proxy
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://localhost:5000", // Auth-Service base URL
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "/api/auth" }, // Maintain the same path structure
    logLevel: "debug",
    on: {
      proxyReq: fixRequestBody, // Fix POST request body issues
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(
        `[Proxy] Forwarding request to Auth Service: ${req.method} ${req.originalUrl}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(
        `[Proxy] Response received from Auth Service: ${req.method} ${req.originalUrl}`
      );
    },
    onError: (err, req, res) => {
      logger.error(`[Proxy] Error connecting to Auth Service: ${err.message}`);
      res.status(502).json({ message: "Error connecting to Auth Service" });
    },
  })
);

// Course-Checker Service Proxy
app.use(
  "/api/courses",
  createProxyMiddleware({
    target: "http://localhost:5002", // Course Checker Service base URL
    changeOrigin: true,
    pathRewrite: { "^/api/courses": "/api/courses" }, // Keep `/api/courses` structure
    logLevel: "debug",
    on: {
      proxyReq: fixRequestBody,
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(
        `[Proxy] Forwarding request to Course Checker Service: ${req.method} ${req.originalUrl}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(
        `[Proxy] Response received from Course Checker Service: ${req.method} ${req.originalUrl}`
      );
    },
    onError: (err, req, res) => {
      logger.error(
        `[Proxy] Error connecting to Course Checker Service: ${err.message}`
      );
      res
        .status(502)
        .json({ message: "Error connecting to Course Checker Service" });
    },
  })
);

// certificate-Checker Service Proxy
app.use(
  "/api/certificates",
  createProxyMiddleware({
    target: "http://localhost:5001", // Course Checker Service base URL
    changeOrigin: true,
    pathRewrite: { "^/api/certificates": "/api/certificates" }, // Keep `/api/courses` structure
    logLevel: "debug",
    on: {
      proxyReq: fixRequestBody,
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(
        `[Proxy] Forwarding request to Course Checker Service: ${req.method} ${req.originalUrl}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(
        `[Proxy] Response received from Course Checker Service: ${req.method} ${req.originalUrl}`
      );
    },
    onError: (err, req, res) => {
      logger.error(
        `[Proxy] Error connecting to Course Checker Service: ${err.message}`
      );
      res
        .status(502)
        .json({ message: "Error connecting to Course Checker Service" });
    },
  })
);

// Prerequisite-Checker Service Proxy
app.use(
  "/api/prerequisites",
  createProxyMiddleware({
    target: "http://localhost:5003", // Prerequisite Checker Service base URL
    changeOrigin: true,
    pathRewrite: { "^/api/prerequisites": "/api/prerequisites" }, // Keep `/api/prerequisites` structure
    logLevel: "debug",
    on: {
      proxyReq: fixRequestBody,
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(
        `[Proxy] Forwarding request to Prerequisite Checker Service: ${req.method} ${req.originalUrl}`
      );
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(
        `[Proxy] Response received from Prerequisite Checker Service: ${req.method} ${req.originalUrl}`
      );
    },
    onError: (err, req, res) => {
      logger.error(
        `[Proxy] Error connecting to Prerequisite Checker Service: ${err.message}`
      );
      res
        .status(502)
        .json({ message: "Error connecting to Prerequisite Checker Service" });
    },
  })
);

// Connect to MongoDB
const startServer = async () => {
  try {
    // Database connection
    connectDB(process.env.MONGO_URI);
    // Start server
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      logger.info(`API Gateway running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

startServer();
