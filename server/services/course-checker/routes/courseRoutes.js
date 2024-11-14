const express = require("express");
const {
  getAllCourses,
  filterCourses,
  getCourseDetails,
  addOrModifyCourses,
} = require("../controllers/courseController");
const logger = require("../../../api-gateway/common/utils/logger");
const passport = require("../../../api-gateway/common/config/passport");
const {
  verifyAdmin,
} = require("../../../api-gateway/common/middleware/verifyAdmin");
const {
  bulkUploadRateLimiter,
} = require("../../../api-gateway/common/middleware/rateLimiter");

const router = express.Router();

// Routes
// Get all courses grouped by categories, subjects, and levels
router.get("/all", getAllCourses);

// Filter courses based on criteria
router.post("/filter", filterCourses);

// Get course details by course ID
router.get("/:courseId", getCourseDetails);

// Route for Bulk Add or Modify Courses
router.post(
  "/bulk",
  (req, res, next) => {
    logger.info(`Incoming request to /api/courses/bulk from IP: ${req.ip}`);
    next();
  },
  passport.authenticate("jwt", { session: false }),
  (err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
      logger.warn(
        `Unauthorized access attempt to /api/courses/bulk by IP: ${req.ip}`
      );
      return res.status(401).json({ message: "Invalid or missing token." });
    }
    next(err);
  },
  verifyAdmin,
  bulkUploadRateLimiter,
  addOrModifyCourses
);

module.exports = router;
