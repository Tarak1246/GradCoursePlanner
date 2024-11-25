const express = require("express");
const {
  getAllCourses,
  filterCourses,
  getCourseDetails,
  addOrModifyCourses,
  validateCourseSelection,
  getEnumValues,
  registerCourse,
  getProgramOfStudy,
  updateCourseCompletion,
  deleteCourse
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
router.post("/filter-courses", filterCourses);

// Route to fetch all enum values
router.get("/enum-values", getEnumValues);

router.get("/program-of-study", getProgramOfStudy);

router.put("/update-course-completion", updateCourseCompletion);

// Route for Bulk Add or Modify Courses
router.post("/bulk", verifyAdmin, bulkUploadRateLimiter, addOrModifyCourses);

router.get("/course-check/:courseId", validateCourseSelection);

router.get("/register-course/:courseId", registerCourse);
// Get course details by course ID
router.get("/:courseId", getCourseDetails);

router.delete("/:courseId", deleteCourse);

module.exports = router;
