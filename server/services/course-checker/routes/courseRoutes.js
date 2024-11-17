const express = require("express");
const {
  getAllCourses,
  filterCourses,
  getCourseDetails,
  addOrModifyCourses,
  registerCourse,
} = require("../controllers/courseController");
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
router.post("/bulk", verifyAdmin, bulkUploadRateLimiter, addOrModifyCourses);

router.get("/api/course-check/:courseId", registerCourse);

module.exports = router;
