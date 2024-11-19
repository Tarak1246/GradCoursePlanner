const ProgramOfStudy = require("../../../api-gateway/common/models/programOfStudySchema");
const Course = require("../../../api-gateway/common/models/Course");
const logger = require("../../../api-gateway/common/utils/logger");
const mongoose = require("mongoose");
/**
 * Check prerequisites for a selected course
 */
exports.checkPrerequisites = async (req, res) => {
  let userId = req?.user?.id;
  let { courseId } = req.params;
console.log(userId);
  try {
    if (!userId) {
      logger.warn("User ID missing in JWT token");
      return res
        .status(401)
        .json({ status:"rejected", message: "Invalid token: User ID missing" });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      logger.warn(`Invalid courseId provided: ${courseId}`);
      return res.status(400).json({ status:"rejected", message: "Invalid courseId format" });
    }

    // Convert IDs to ObjectId
    userId = new mongoose.Types.ObjectId(userId);
    courseId = new mongoose.Types.ObjectId(courseId);

    // Fetch the selected course
    const course = await Course.findById(courseId);
    if (!course) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res.status(404).json({ status:"rejected", message: "Course not found" });
    }

    // Fetch the student's program of study
    const programOfStudy = await ProgramOfStudy.findOne({ userId }).populate(
      "courses.courseId",
      "title credits prerequisites semesterTaken yearTaken"
    );

    const completedCourses =
      programOfStudy?.courses.filter((c) => c.status === "Completed") || [];
    const plannedCourses =
      programOfStudy?.courses.filter((c) => c.status === "Planned") || [];

    // Validate prerequisites
    const unmetPrerequisites = course.prerequisites.filter((prereq) => {
      const isCompleted = completedCourses.some(
        (c) => c.courseId.title === prereq
      );
      const isPlanned = plannedCourses.some((c) => c.courseId.title === prereq);
      return !(isCompleted || isPlanned);
    });

    const semesterValue = { spring: 1, summer: 2, fall: 3 };
    const invalidPlannedPrerequisites = plannedCourses
      .filter((planned) =>
        course.prerequisites.includes(planned.courseId.title)
      )
      .filter((planned) => {
        const plannedYear = planned.yearTaken;
        const plannedSemester =
          semesterValue[planned.semesterTaken.toLowerCase()];
        const currentYear = course.year;
        const currentSemester = semesterValue[course.semester.toLowerCase()];
        return (
          plannedYear > currentYear ||
          (plannedYear === currentYear && plannedSemester > currentSemester)
        );
      });

    // Build response
    const response = {
      status:"fullfilled",
      data: {
        eligible:
          unmetPrerequisites.length === 0 &&
          invalidPlannedPrerequisites.length === 0,
        message:
          unmetPrerequisites.length > 0
            ? "You need to complete the following prerequisites before registering for this course."
            : invalidPlannedPrerequisites.length > 0
            ? "Some prerequisites are planned but not in a valid semester or year. Please adjust your plan."
            : "You meet all prerequisites for this course.",
        unmetPrerequisites,
        invalidPlannedPrerequisites,
      }
    };

    logger.info(
      `Prerequisite check for user ${userId} and course ${courseId}:`,
      response
    );
    return res.status(200).json(response);
  } catch (error) {
    logger.error(
      `Error checking prerequisites for user ${
        userId || "unknown"
      } and course ${courseId || "unknown"}:`,
      error
    );
    return res.status(500).json({ status:"rejected", message: `Error checking prerequisites for user ${
        userId || "unknown"
      } and course ${courseId || "unknown"}:${error}`
       });
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
    return res.status(400).json({
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
