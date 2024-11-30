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
        .json({
          status: "rejected",
          message: "Invalid token: User ID missing",
        });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      logger.warn(`Invalid courseId provided: ${courseId}`);
      return res
        .status(400)
        .json({ status: "rejected", message: "Invalid courseId format" });
    }

    // Convert IDs to ObjectId
    userId = new mongoose.Types.ObjectId(userId);
    courseId = new mongoose.Types.ObjectId(courseId);

    // Fetch user's ProgramOfStudy and selected course concurrently
    const [programOfStudy, course] = await Promise.all([
      ProgramOfStudy.findOne({ userId }).lean(),
      Course.findById(courseId).lean(),
    ]);

    if (!course) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res
        .status(404)
        .json({ status: "rejected", message: "Course not found" });
    }

    const completedCourses =
      programOfStudy?.courses.filter((c) => c.status === "Completed") || [];
    const plannedCourses =
      programOfStudy?.courses.filter((c) => c.status === "Planned") || [];

    // Validate prerequisites
    const unmetPrerequisites = course?.prerequisites?.filter((prereq) => {
      const isCompleted = completedCourses.some(
        (c) => c.course.toString() === prereq.toString()
      );
      const isPlanned = plannedCourses.some(
        (c) => c.course.toString() === prereq.toString()
      );
      return !(isCompleted || isPlanned);
    });

    const semesterValue = { spring: 1, summer: 2, fall: 3 };
    const invalidPlannedPrerequisites = plannedCourses
      .filter((planned) => course?.prerequisites?.includes(planned.course))
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
      status: "fullfilled",
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
      },
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
    return res
      .status(500)
      .json({
        status: "rejected",
        message: `Error checking prerequisites for user ${
          userId || "unknown"
        } and course ${courseId || "unknown"}:${error}`,
      });
  }
};
