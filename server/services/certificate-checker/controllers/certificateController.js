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
      return res.json({
        statusCode: 401,
        status: "rejected",
        message: "Invalid token: User ID missing",
        eligible: false,
      });
    }

    if (!courseId) {
      logger.warn("Invalid request: Missing courseId");
      return res.json({
        statusCode: 400,
        status: "rejected",
        message: "courseId is required",
        eligible: false,
      });
    }

    // Convert IDs to ObjectId
    let userObjectId = new mongoose.Types.ObjectId(userId);
    courseId = new mongoose.Types.ObjectId(courseId);

    // Fetch user's ProgramOfStudy and selected course concurrently
    const [programOfStudy, course] = await Promise.all([
      ProgramOfStudy.findOne({ userId: userObjectId }).lean(),
      Course.findById(courseId).lean(),
    ]);

    if (!course) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res.json({
        statusCode: 404,
        status: "rejected",
        message: "Course not found",
        eligible: false,
      });
    }

    // Extract completed courses from the program of study
    const completedCourses = programOfStudy
      ? programOfStudy.courses
          .filter((c) => c.status === "Completed")
          .map((c) => c.course.toString())
      : [];

    // Fetch certificates associated with the course
    const certificates = await Certificate.find({
      name: { $in: course.certificationRequirements },
    }).lean();

    if (certificates.length === 0) {
      logger.info(`No eligible certificates found for course: ${courseId}`);
      return res.json({
        statusCode: 200,
        status: "fulfilled",
        data: [
          {
            message: "No certificates are associated with this course.",
            eligible: false,
          },
        ],
      });
    }

    const results = [];

    // Check eligibility for each certificate
    for (const certificate of certificates) {
      const requiredCourses = certificate.requiredCourses.map((c) => c.course);
      const completedRequiredCourses = completedCourses.filter((c) =>
        requiredCourses.includes(c)
      );
      const remainingCourses = requiredCourses.filter(
        (reqCourse) => !completedCourses.includes(reqCourse)
      );

      const isCurrentCourseEligible = requiredCourses.includes(course.course);

      if (certificate.name === "Big Data") {
        // Special logic for Big Data certificate
        if (completedRequiredCourses.length >= 6) {
          results.push({
            certificateName: certificate.name,
            message: `You have already earned the "${certificate.name}" certificate.`,
            eligible: true,
          });
        } else if (
          completedRequiredCourses.length + 1 === 6 &&
          isCurrentCourseEligible
        ) {
          results.push({
            certificateName: certificate.name,
            message: `You will earn the "${certificate.name}" certificate by completing this course.`,
            eligible: true,
          });
        } else {
          results.push({
            certificateName: certificate.name,
            message: `You are eligible for "${certificate.name}" certificate by choosing this subject. You have completed ${completedRequiredCourses.length} out of 6 required courses for the "${certificate.name}" certificate. Complete ${
              6 - completedRequiredCourses.length
            } more courses to earn it.`,
            remainingCourses,
            eligible: true,
          });
        }
      } else {
        // General logic for other certificates
        if (isCurrentCourseEligible) {
          if (
            remainingCourses.length === 1 &&
            remainingCourses[0] === course.course
          ) {
            results.push({
              certificateName: certificate.name,
              message: `You will earn the "${certificate.name}" certificate by completing this course.`,
              eligible: true,
            });
          } else if (remainingCourses.length > 0) {
            results.push({
              certificateName: certificate.name,
              message: `You are ${remainingCourses.length} course(s) away from earning the "${certificate.name}" certificate.`,
              remainingCourses,
              eligible: true,
            });
          } else {
            results.push({
              certificateName: certificate.name,
              message: `You have already earned the "${certificate.name}" certificate.`,
              eligible: true,
            });
          }
        } else {
          results.push({
            certificateName: certificate.name,
            message: `This course does not contribute to the "${certificate.name}" certificate.`,
            eligible: false,
          });
        }
      }
    }

    logger.info(
      `Certificate check results for user ${userId} and course ${courseId}:`,
      results
    );
    return res.json({ statusCode: 200, status: "fulfilled", data: results });
  } catch (error) {
    logger.error(
      `Error checking certificates for user ${userId || "unknown"} and course ${
        req.params.courseId || "unknown"
      }:`,
      error
    );
    return res.json({
      statusCode: 500,
      status: "rejected",
      message: `Error checking certificates for user ${
        userId || "unknown"
      } and course ${req.params.courseId || "unknown"}: ${error.message}`,
    });
  }
};

