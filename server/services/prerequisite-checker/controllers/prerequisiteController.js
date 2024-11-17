const ProgramOfStudy = require("../../../api-gateway/common/models/programOfStudySchema");
const Course = require("../../../api-gateway/common/models/Course");
const logger = require("../../../api-gateway/common/utils/logger");

/**
 * Check prerequisites for a selected course
 */
exports.checkPrerequisites = async (req, res) => {
    let userId = req?.user?.id;
    const { courseId } = req.params;

    try {
      // Extract user ID from the JWT token
    //   const authHeader = req.headers.authorization;
    //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //     logger.warn("Authorization token missing or malformed");
    //     return res.status(401).json({ message: "Authorization token missing or malformed" });
    //   }
  
    //   const token = authHeader.split(" ")[1];
    //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //   userId = decoded.id;
  
      if (!userId) {
        logger.warn("User ID missing in JWT token");
        return res.status(401).json({ message: "Invalid token: User ID missing" });
      }
  
      if (!courseId) {
        logger.warn("Invalid request: Missing courseId");
        return res.status(400).json({ message: "courseId is required" });
      }
  
      // Fetch the selected course
      const course = await Course.findById(courseId);
      if (!course) {
        logger.warn(`Course not found with ID: ${courseId}`);
        return res.status(404).json({ message: "Course not found" });
      }
  
      // Fetch the student's program of study
      const programOfStudy = await ProgramOfStudy.findOne({ userId }).populate(
        "courses.courseId",
        "title credits prerequisites semesterTaken yearTaken"
      );
  
      const completedCourses = programOfStudy
        ? programOfStudy.courses.filter((c) => c.status === "Completed")
        : [];
      const plannedCourses = programOfStudy
        ? programOfStudy.courses.filter((c) => c.status === "Planned")
        : [];
  
      // Check prerequisites for the selected course
      const unmetPrerequisites = course.prerequisites.filter((prereq) => {
        const isCompleted = completedCourses.some((c) => c.courseId.title === prereq);
        const isPlanned = plannedCourses.some((c) => c.courseId.title === prereq);
        return !(isCompleted || isPlanned);
      });
  
      // Check for planned prerequisites that are not yet valid
      const semesterValue = { spring: 1, summer: 2, fall: 3 };
      const invalidPlannedPrerequisites = course.prerequisites.filter((prereq) => {
        const plannedPrerequisite = plannedCourses.find((c) => c.courseId.title === prereq);
        if (plannedPrerequisite) {
          const plannedYear = plannedPrerequisite.yearTaken;
          const plannedSemester = semesterValue[plannedPrerequisite.semesterTaken.toLowerCase()];
          const currentYear = course.year;
          const currentSemester = semesterValue[course.semester.toLowerCase()];
  
          // Check if planned prerequisite is in a valid semester and year
          return plannedYear > currentYear || (plannedYear === currentYear && plannedSemester >= currentSemester);
        }
        return false;
      });
  
      // Build response message
      let message = "";
      let eligible = true;
  
      if (unmetPrerequisites.length > 0) {
        message = "You need to complete the following prerequisites before registering for this course.";
        eligible = false;
      } else if (invalidPlannedPrerequisites.length > 0) {
        message =
          "Some prerequisites are planned but not in a valid semester or year. Please plan or complete them in an earlier semester.";
        eligible = false;
      } else {
        message = "You meet all prerequisites for this course.";
      }
  
      // Response
      const response = {
        eligible,
        message,
        unmetPrerequisites,
        invalidPlannedPrerequisites,
      };
  
      logger.info(`Prerequisite check for user ${userId} and course ${courseId}:`, response);
      return res.status(200).json(response);
    } catch (error) {
      logger.error(`Error checking prerequisites for user ${userId || "unknown"} and course ${courseId || "unknown"}: ${error.message}`);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  

/**
 * Mark prerequisites as completed based on student input
 */
exports.markPrerequisitesCompleted = async (req, res) => {
  const { studentId, prerequisites } = req.body;

  if (!studentId || !prerequisites || !Array.isArray(prerequisites)) {
    logger.warn(
      "Invalid request: Missing or invalid studentId or prerequisites"
    );
    return res
      .status(400)
      .json({
        message: "studentId and valid prerequisites array are required",
      });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      logger.warn(`Student not found: ${studentId}`);
      return res.status(404).json({ message: "Student not found" });
    }

    // Update completed prerequisites
    student.completedPrerequisites = [
      ...new Set([...student.completedPrerequisites, ...prerequisites]),
    ];
    await student.save();

    logger.info(`Updated prerequisites for student ${studentId}`);
    res.status(200).json({ message: "Prerequisites marked as completed" });
  } catch (error) {
    logger.error("Error marking prerequisites as completed:", {
      error: error.message,
    });
    res.status(500).json({ message: "Internal server error" });
  }
};
