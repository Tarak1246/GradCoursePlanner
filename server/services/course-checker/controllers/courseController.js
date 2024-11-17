const mongoose = require("mongoose");
const Course = require("../../../api-gateway/common/models/Course");
const logger = require("../../../api-gateway/common/utils/logger");
const ProgramOfStudy = require("../../../api-gateway/common/models/programOfStudySchema");
const xlsx = require("xlsx");
const jwt = require('jsonwebtoken');
const {
  courseValidationSchema,
} = require("../../../api-gateway/common/validators/courseValidator");

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({});

    if (courses.length === 0) {
      logger.info("No courses found");
      return res.status(404).json({ message: "No courses found" });
    }

    const response = {
      categories: {},
      subjects: {},
      levels: {},
    };

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

    logger.info("Fetched all courses successfully");
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching all courses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.filterCourses = async (req, res) => {
  try {
    const { category, subject, certificationRequirements, level } = req.body;

    // Build query dynamically
    const query = {};
    if (category) query.category = { $in: category };
    if (subject) query.subject = { $in: subject };
    if (certificationRequirements)
      query.certificationRequirements = { $in: certificationRequirements };
    if (level) query.level = { $in: level };

    const courses = await Course.find(query);

    if (courses.length === 0) {
      logger.info("No courses match the given filters");
      return res
        .status(404)
        .json({ message: "No courses match the given filters" });
    }

    logger.info("Filtered courses fetched successfully");
    res.status(200).json(courses);
  } catch (error) {
    logger.error("Error filtering courses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate courseId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      logger.warn(`Invalid course ID provided: ${courseId}`);
      return res.status(400).json({ message: "Invalid course ID" });
    }

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
        // Only keep required columns and filter out extra columns
        const filteredRow = {};
        Object.keys(row).forEach((key) => {
          if (requiredColumns.includes(key)) {
            // Handle arrays for specific fields
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
        upsert: true, // Add if it doesn't exist
      },
    }));

    await Course.bulkWrite(bulkOps);

    logger.info(`${validCourses.length} courses added/modified successfully`);
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
  let userId;
  try {
    // Extract user ID from the JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Authorization token missing or malformed");
      return res.status(401).json({ message: "Authorization token missing or malformed" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;

    if (!userId) {
      logger.warn("User ID missing in JWT token");
      return res.status(401).json({ message: "Invalid token: User ID missing" });
    }

    const { courseId } = req.params;
    if (!courseId) {
      logger.warn("Invalid request: Missing courseId");
      return res.status(400).json({ message: "courseId is required" });
    }

    // Fetch user's program of study
    const programOfStudy = await ProgramOfStudy.findOne({ userId });
    const plannedAndCompletedCourses = programOfStudy
      ? programOfStudy.courses.filter((c) => c.status === "Completed" || c.status === "Planned")
      : [];

    // Fetch selected course
    const course = await Course.findById(courseId);
    if (!course) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the course is already planned or completed
    const existingCourse = plannedAndCompletedCourses.find((c) => c.courseId.toString() === courseId);
    if (existingCourse) {
      logger.info(`Course already planned or completed for user ID: ${userId}`);
      return res.status(400).json({
        isValid: false,
        message: "This course is already planned or completed.",
      });
    }

    // If no program of study exists, no validation required
    if (!programOfStudy) {
      logger.info(`First-time registration: Skipping validations for user ID: ${userId}`);
      return res.status(200).json({
        isValid: true,
        message: "First-time registration. No validation required.",
      });
    }

    // Calculate total credits (Planned + Completed)
    const totalCredits = plannedAndCompletedCourses.reduce((sum, c) => sum + c.credits, 0);

    // If credits <= 12, no validation required
    if (totalCredits <= 12) {
      logger.info(`Credits <= 12: Skipping validations for user ID: ${userId}`);
      return res.status(200).json({
        isValid: true,
        message: "Credits <= 12. No validation required.",
      });
    }

    // Check CEG/6000-Level Credit Limit (<= 12 credits)
    const ceg6000Credits = plannedAndCompletedCourses
      .filter((c) => c.courseId.subject === "CEG" || c.courseId.course.startsWith("6"))
      .reduce((sum, c) => sum + c.credits, 0);

    if (ceg6000Credits + course.credits > 12) {
      logger.info(`CEG/6000-Level credit limit exceeded for user ID: ${userId}`);
      return res.status(400).json({
        isValid: false,
        message: "You cannot exceed 12 credits at the 6000 level or in CEG courses.",
      });
    }

    // If credits >= 24, ensure core course validation
    const coreCourses = plannedAndCompletedCourses.filter((c) =>
      ["7200", "7370", "7100", "7140"].includes(c.courseId.course)
    );
    if (totalCredits >= 24) {
      if (coreCourses.length === 0 && !["7200", "7370", "7100", "7140"].includes(course.course)) {
        logger.info(`Credits >= 24: Current course must be a core course for user ID: ${userId}`);
        return res.status(400).json({
          isValid: false,
          message: "Credits >= 24. You must take a core course.",
        });
      }

      if (coreCourses.length === 1 && totalCredits + course.credits > 27) {
        logger.info(
          `Credits >= 27: Only one core course completed. Current course must be a core course for user ID: ${userId}`
        );
        return res.status(400).json({
          isValid: false,
          message: "Credits >= 27. You must take another core course.",
        });
      }
    }

    logger.info(`Course validated successfully for user ID: ${userId}`);
    return res.status(200).json({
      isValid: true,
      message: "Course selection is valid.",
    });
  } catch (error) {
    logger.error(`Error validating course selection for user ID: ${userId || "unknown"}`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

