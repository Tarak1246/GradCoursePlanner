const Certificate = require("../../../api-gateway/common/models/certificateSchema"); // Import Certificate model
const Course = require("../../../api-gateway/common/models/Course"); // Import Course model
const ProgramOfStudy = require("../../../api-gateway/common/models/programOfStudySchema"); // Import ProgramOfStudy model
const logger = require("../../../api-gateway/common/utils/logger"); // Import logger
const mongoose = require("mongoose");

exports.checkCertificates = async (req, res) => {
  let userId = req?.user?.id;
  let { courseId } = req.params;

  try {
    if (!userId) {
      logger.warn("User ID missing in JWT token");
      return res.status(401).json({
        status: "rejected",
        message: "Invalid token: User ID missing",
      });
    }

    if (!courseId) {
      logger.warn("Invalid request: Missing courseId");
      return res
        .status(400)
        .json({ status: "rejected", message: "courseId is required" });
    }

    // Convert IDs to ObjectId
    userId = new mongoose.Types.ObjectId(userId);
    courseId = new mongoose.Types.ObjectId(courseId);

    // Fetch the course details
    const course = await Course.findById(courseId);
    if (!course) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res
        .status(404)
        .json({ status: "rejected", message: "Course not found" });
    }

    // Fetch the student's program of study
    const programOfStudy = await ProgramOfStudy.findOne({ userId }).populate(
      "courses.courseId",
      "title credits"
    );

    const completedCourses = programOfStudy
      ? programOfStudy.courses.filter((c) => c.status === "Completed")
      : [];

    // Fetch all certificates and populate required courses
    const certificates = await Certificate.find().populate(
      "requiredCourses.courseId",
      "title"
    );

    const results = [];
    certificates.forEach((certificate) => {
      const requiredCourses = certificate.requiredCourses.map(
        (c) => c.courseId?._id?.toString() // Ensure we're only dealing with the course IDs
      );

      const completedCourseIds = completedCourses.map((c) =>
        c.courseId?._id?.toString()
      );

      // Calculate remaining courses for the certificate
      const remainingCourses = requiredCourses.filter(
        (reqCourseId) => !completedCourseIds.includes(reqCourseId)
      );

      // Check if the selected course contributes to the certificate
      const isCurrentCourseEligible = requiredCourses.includes(
        courseId.toString()
      );

      if (isCurrentCourseEligible) {
        if (remainingCourses.length === 1 && remainingCourses[0] === courseId.toString()) {
          // Eligible after this course
          results.push({
            certificateName: certificate.name,
            message: `You will earn the "${certificate.name}" certificate by completing this course.`,
            eligible: true,
          });
        } else {
          // Additional courses required
          results.push({
            certificateName: certificate.name,
            message: `You are ${remainingCourses.length} course(s) away from earning the "${certificate.name}" certificate.`,
            eligible: true,
          });
        }
      }
    });

    // If no certificates apply
    if (results.length === 0) {
      results.push({
        message:
          "This course does not contribute to any certificate.",
        eligible: false,
      });
    }

    logger.info(
      `Certificate check results for user ${userId} and course ${courseId}:`,
      results
    );
    return res.status(200).json({ status: "fulfilled", data: results });
  } catch (error) {
    logger.error(
      `Error checking certificates for user ${userId || "unknown"} and course ${
        req.params.courseId || "unknown"
      }:`,
      error
    );
    return res.status(500).json({
      status: "rejected",
      message: `Error checking certificates for user ${
        userId || "unknown"
      } and course ${req.params.courseId || "unknown"}: ${error.message}`,
    });
  }
};

