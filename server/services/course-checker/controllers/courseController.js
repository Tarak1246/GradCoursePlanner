const mongoose = require("mongoose");
const Course = require("../../../api-gateway/common/models/Course");
const logger = require("../../../api-gateway/common/utils/logger");
const ProgramOfStudy = require("../../../api-gateway/common/models/programOfStudySchema");
const Certificate = require("../../../api-gateway/common/models/certificateSchema");
const xlsx = require("xlsx");
const {
  courseValidationSchema,
} = require("../../../api-gateway/common/validators/courseValidator");

exports.getAllCourses = async (req, res) => {
  try {
    // Fetch all courses
    const courses = await Course.find({});
    const certificates = await Certificate.find({}).populate(
      "requiredCourses.courseId",
      "title"
    );

    if (courses.length === 0) {
      logger.info("No courses found");
      return res.status(404).json({ message: "No courses found" });
    }

    const response = {
      categories: {},
      subjects: {},
      levels: {},
      certificates: {},
    };

    // Process courses
    courses.forEach((course) => {
      // Group by category
      course.category.forEach((cat) => {
        if (!response.categories[cat]) {
          response.categories[cat] = [];
        }
        if (!response.categories[cat].includes(course.title)) {
          response.categories[cat].push(course.title);
        }
      });

      // Group by subject
      if (!response.subjects[course.subject]) {
        response.subjects[course.subject] = [];
      }
      if (!response.subjects[course.subject].includes(course.title)) {
        response.subjects[course.subject].push(course.title);
      }

      // Group by level
      if (!response.levels[course.level]) {
        response.levels[course.level] = [];
      }
      if (!response.levels[course.level].includes(course.title)) {
        response.levels[course.level].push(course.title);
      }
    });

    // Process certificates
    certificates.forEach((certificate) => {
      response.certificates[certificate.name] = certificate.requiredCourses.map(
        (rc) => rc.courseId?.title || "Unknown"
      );
    });

    logger.info("Fetched all courses and certificates successfully");
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching all courses and certificates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.filterCourses = async (req, res) => {
  try {
    // Extract filters from request body
    const { subject, campus, semester, year, certification, level } = req.body;

    // Validate required fields
    if (!subject || !campus || !semester || !year || !level) {
      logger.warn("Missing required fields in the request");
      return res.status(400).json({
        status: "failure",
        message: "subject, campus, semester, year, and level are required",
      });
    }

    // Build the query dynamically
    const query = {
      subject, // Exact match for strings
      campus,
      semester,
      year,
      level,
    };

    if (certification) {
      // Check if the certification exists in the `certificationRequirements` array
      query.certificationRequirements = { $in: [certification] };
    }

    logger.info(`Fetching courses with filters: ${JSON.stringify(query)}`);

    // Fetch courses from the database
    const courses = await Course.find(query).lean();

    if (!courses.length) {
      logger.info("No courses found matching the filters");
      return res.status(404).json({
        status: "failure",
        message: "No courses found matching the filters",
      });
    }

    logger.info(`Successfully fetched ${courses.length} courses`);
    return res.status(200).json({
      status: "success",
      message: "Courses fetched successfully",
      values: courses,
    });
  } catch (error) {
    logger.error("Error fetching courses", { error: error.message });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};

exports.getCourseDetails = async (req, res) => {
  console.log("Fetching course details");
  try {
    let { courseId } = req.params;
    // Convert courseId to ObjectId
    courseId = new mongoose.Types.ObjectId(courseId);
    const course = await Course.findById(courseId);

    if (!course) {
      logger.info(`Course with ID ${courseId} not found`);
      return res.status(404).json({ message: "Course not found" });
    }

    logger.info(`Course details fetched successfully for ID ${courseId}`);
    res.status(200).json(course);
  } catch (error) {
    logger.error(`Error fetching course details: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addOrModifyCourses = async (req, res) => {
  try {
    // Check if a file is provided
    if (!req.files || !req.files.file) {
      logger.warn("No file uploaded in the request");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Ensure only one file is uploaded
    if (Object.keys(req.files).length > 1) {
      logger.warn("Multiple files uploaded in the request");
      return res.status(400).json({
        message: "Only one file is allowed. Please upload a single Excel file.",
      });
    }

    const file = req.files.file;

    // Validate the file type (ensure it's an Excel file)
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      logger.warn(`Invalid file type uploaded: ${file.name}`);
      return res.status(400).json({
        message: "Invalid file type. Only Excel files are supported.",
      });
    }

    // Read the Excel file
    const workbook = xlsx.read(file.data, { type: "buffer" });
    const sheets = workbook.SheetNames;

    if (sheets.length === 0) {
      logger.warn("Uploaded Excel file contains no sheets");
      return res
        .status(400)
        .json({ message: "The Excel file contains no sheets" });
    }

    const requiredColumns = [
      "crn",
      "subject",
      "course",
      "section",
      "campus",
      "semester",
      "year",
      "level",
      "title",
      "credits",
      "days",
      "time",
      "prerequisites",
      "category",
      "certificationRequirements",
      "sectionCapacity",
      "sectionActual",
      "sectionRemaining",
      "waitlistCapacity",
      "waitlistActual",
      "waitlistRemaining",
      "crosslistCapacity",
      "crosslistActual",
      "crosslistRemaining",
      "instructor",
      "duration",
      "location",
      "attribute",
      "restrictions",
      "status",
    ];

    let allData = [];

    // Process all sheets
    sheets.forEach((sheetName) => {
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: "",
      });

      sheetData.forEach((row) => {
        const filteredRow = {};
        Object.keys(row).forEach((key) => {
          if (requiredColumns.includes(key)) {
            if (
              [
                "prerequisites",
                "certificationRequirements",
                "category",
              ].includes(key)
            ) {
              try {
                filteredRow[key] = row[key] ? JSON.parse(row[key]) : [];
              } catch {
                filteredRow[key] = [];
              }
            } else {
              filteredRow[key] = row[key]?.toString().trim();
            }
          }
        });
        allData.push(filteredRow);
      });
    });

    if (allData.length === 0) {
      logger.warn("The Excel file contains no valid data");
      return res
        .status(400)
        .json({ message: "The Excel file contains no data" });
    }

    // Validate each row
    const errors = [];
    const validCourses = [];

    allData.forEach((row, index) => {
      const { error } = courseValidationSchema.validate(row, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          row: index + 2, // Adding 2 to account for header row and 0-based index
          message: error.details.map((err) => err.message),
        });
      } else {
        validCourses.push(row);
      }
    });

    if (errors.length > 0) {
      logger.warn(
        `Validation errors in uploaded Excel file: ${errors.length} rows affected`
      );
      return res.status(400).json({ message: "Validation errors", errors });
    }

    // Add or Update courses in the database
    const bulkOps = validCourses.map((course) => ({
      updateOne: {
        filter: {
          crn: course.crn,
          semester: course.semester,
          year: course.year,
        },
        update: { $set: course },
        upsert: true,
      },
    }));

    const results = await Course.bulkWrite(bulkOps);
    logger.info(`${validCourses.length} courses added/modified successfully`);

    // Process certificates
    for (const course of validCourses) {
      const dbCourse = await Course.findOne({
        crn: course.crn,
        semester: course.semester,
        year: course.year,
      });

      if (!dbCourse) {
        logger.warn(`Course not found in database: ${course.title}`);
        continue;
      }

      if (course.certificationRequirements.length > 0) {
        for (const certName of course.certificationRequirements) {
          let certificate = await Certificate.findOne({ name: certName });
          if (certificate) {
            const courseExists = certificate.requiredCourses.some(
              (c) => c.courseId.toString() === dbCourse._id.toString()
            );

            if (!courseExists) {
              certificate.requiredCourses.push({ courseId: dbCourse._id });
              await certificate.save();
              logger.info(
                `Updated certificate: ${certName} with course: ${dbCourse.title}`
              );
            }
          } else {
            const newCertificate = new Certificate({
              name: certName,
              requiredCourses: [{ courseId: dbCourse._id }],
            });
            await newCertificate.save();
            logger.info(
              `Created new certificate: ${certName} with course: ${dbCourse.title}`
            );
          }
        }
      }
    }

    res.status(200).json({
      message: `${validCourses.length} courses added/modified successfully`,
    });
  } catch (error) {
    logger.error("Error processing Excel file", { error: error.message });
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.validateCourseSelection = async (req, res) => {
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

    // Convert courseId to ObjectId
    userId = new mongoose.Types.ObjectId(userId);
    // Convert courseId to ObjectId
    courseId = new mongoose.Types.ObjectId(courseId);
    // Fetch user's program of study
    const programOfStudy = await ProgramOfStudy.findOne({ userId });
    const plannedAndCompletedCourses = programOfStudy
      ? programOfStudy.courses.filter(
          (c) => c.status === "Completed" || c.status === "Planned"
        )
      : [];

    // Fetch selected course
    const course = await Course.findById(courseId);
    if (!course) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res
        .status(404)
        .json({ status: "rejected", message: "Course not found" });
    }

    // Check if the course is already planned or completed
    const existingCourse = plannedAndCompletedCourses.find(
      (c) => c.courseId.toString() === courseId
    );

    if (existingCourse) {
      logger.info(`Course already planned or completed for user ID: ${userId}`);
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message: "This course is already planned or completed.",
        },
      });
    }

    // If no program of study exists, no validation required
    if (!programOfStudy) {
      logger.info(
        `First-time registration: Skipping validations for user ID: ${userId}`
      );
      return res.status(200).json({
        status: "fulfilled",
        data: {
          isValid: true,
          message: "First-time registration. No validation required.",
        },
      });
    }

    // Calculate total credits (Planned + Completed)
    const totalCredits = plannedAndCompletedCourses.reduce(
      (sum, c) => sum + c.credits,
      0
    );

    // If credits <= 12, no validation required
    if (totalCredits <= 12) {
      logger.info(`Credits <= 12: Skipping validations for user ID: ${userId}`);
      return res.status(200).json({
        status: "fulfilled",
        data: {
          isValid: true,
          message: "Credits <= 12. No validation required.",
        },
      });
    }

    // Check CEG/6000-Level Credit Limit (<= 12 credits)
    const ceg6000Credits = plannedAndCompletedCourses
      .filter(
        (c) => c.courseId.subject === "CEG" || c.courseId.course.startsWith("6")
      )
      .reduce((sum, c) => sum + c.credits, 0);

    if (ceg6000Credits + course.credits > 12) {
      logger.info(
        `CEG/6000-Level credit limit exceeded for user ID: ${userId}`
      );
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message:
            "You cannot exceed 12 credits at the 6000 level or in CEG courses.",
        },
      });
    }

    // If credits >= 24, ensure core course validation
    const coreCourses = plannedAndCompletedCourses.filter((c) =>
      ["7200", "7370", "7100", "7140"].includes(c.courseId.course)
    );
    if (totalCredits >= 24) {
      if (
        coreCourses.length === 0 &&
        !["7200", "7370", "7100", "7140"].includes(course.course)
      ) {
        logger.info(
          `Credits >= 24: Current course must be a core course for user ID: ${userId}`
        );
        return res.status(400).json({
          status: "fulfilled",
          data: {
            isValid: false,
            message: "Credits >= 24. You must take a core course.",
          },
        });
      }

      if (coreCourses.length === 1 && totalCredits + course.credits > 27) {
        logger.info(
          `Credits >= 27: Only one core course completed. Current course must be a core course for user ID: ${userId}`
        );
        return res.status(400).json({
          status: "fulfilled",
          data: {
            isValid: false,
            message: "Credits >= 27. You must take another core course.",
          },
        });
      }
    }

    logger.info(`Course validated successfully for user ID: ${userId}`);
    return res.status(200).json({
      status: "fulfilled",
      data: {
        isValid: true,
        message: "Course selection is valid.",
      },
    });
  } catch (error) {
    logger.error(
      `Error validating course selection for user ID: ${userId || "unknown"}`,
      error
    );
    return res.status(500).json({
      status: "rejected",
      message: `Error validating course selection for user ID: ${
        userId || "unknown"
      } ${error}`,
    });
  }
};

exports.getEnumValues = async (req, res) => {
  console.log("Fetching enum values for course schema");
  try {
    const courseSchema = Course.schema.paths;

    // Extract enum values for the fields with enums
    const enums = {
      subject: courseSchema.subject?.enumValues || [],
      campus: courseSchema.campus?.enumValues || [],
      semester: courseSchema.semester?.enumValues || [],
      level: courseSchema.level?.enumValues || [],
      category: courseSchema.category?.caster?.enumValues || [],
      certificationRequirements:
        courseSchema.certificationRequirements?.caster?.enumValues || [],
      status: courseSchema.status?.enumValues || [],
    };

    logger.info("Successfully fetched enum values for course schema");
    return res.status(200).json({
      status: "success",
      message: "Enum values fetched successfully",
      values: enums,
    });
  } catch (error) {
    logger.error("Error fetching enum values", { error: error.message });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};
