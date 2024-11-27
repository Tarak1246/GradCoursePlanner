const mongoose = require("mongoose");
const Course = require("../../../api-gateway/common/models/Course");
const logger = require("../../../api-gateway/common/utils/logger");
const ProgramOfStudy = require("../../../api-gateway/common/models/programOfStudySchema");
const Certificate = require("../../../api-gateway/common/models/certificateSchema");
const Feedback = require("../../../api-gateway/common/models/feedbackSchema");

const xlsx = require("xlsx");
const {
  courseValidationSchema,
} = require("../../../api-gateway/common/validators/courseValidator");

exports.getAllCourses = async (req, res) => {
  try {
    // Fetch courses and certificates in parallel for better performance
    const [courses, certificates] = await Promise.all([
      Course.find({}).lean(), // Using `lean()` for better performance
      Certificate.find({}).populate("requiredCourses.courseId", "title").lean(),
    ]);

    if (!courses.length && !certificates.length) {
      logger.info("No courses or certificates found");
      return res
        .status(404)
        .json({ message: "No courses or certificates found" });
    }

    const response = {
      categories: {},
      subjects: {},
      levels: {},
      certificates: {},
    };

    // Process courses into categories, subjects, and levels
    courses.reduce((acc, course) => {
      // Group by category
      course.category.forEach((cat) => {
        if (!acc.categories[cat]) {
          acc.categories[cat] = new Set();
        }
        acc.categories[cat].add(course.title);
      });

      // Group by subject
      if (!acc.subjects[course.subject]) {
        acc.subjects[course.subject] = new Set();
      }
      acc.subjects[course.subject].add(course.title);

      // Group by level
      if (!acc.levels[course.level]) {
        acc.levels[course.level] = new Set();
      }
      acc.levels[course.level].add(course.title);

      return acc;
    }, response);

    // Convert sets to arrays for response
    response.categories = Object.fromEntries(
      Object.entries(response.categories).map(([key, value]) => [
        key,
        [...value],
      ])
    );
    response.subjects = Object.fromEntries(
      Object.entries(response.subjects).map(([key, value]) => [key, [...value]])
    );
    response.levels = Object.fromEntries(
      Object.entries(response.levels).map(([key, value]) => [key, [...value]])
    );

    // Process certificates
    response.certificates = certificates.reduce((acc, certificate) => {
      acc[certificate.name] = certificate.requiredCourses.map(
        (rc) => rc.courseId?.title || "Unknown"
      );
      return acc;
    }, {});

    logger.info("Fetched all courses and certificates successfully");
    return res.status(200).json(response);
  } catch (error) {
    logger.error("Error fetching all courses and certificates:", {
      error: error.message,
    });
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.filterCourses = async (req, res) => {
  try {
    const filters = req.body;
    const { title } = req.body;

    if (!filters || Object.keys(filters).length === 0) {
      logger.warn("No filters provided in the request");
      return res.status(400).json({
        status: "failure",
        message: "At least one filter is required to fetch courses",
      });
    }

    logger.info(`Received filters: ${JSON.stringify(filters)}`);

    // Build the query dynamically
    const query = Object.entries(filters).reduce((acc, [key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        acc[key] = { $in: value }; // Match any value in the array
      } else if (value !== null && value !== undefined && value !== "") {
        acc[key] = value; // Exact match for non-array values
      }
      return acc;
    }, {});

    logger.info(`Constructed query: ${JSON.stringify(query)}`);

    // If no valid query parameters exist after processing
    if (Object.keys(query).length === 0) {
      logger.warn("No valid filters provided in the request body");
      return res.status(400).json({
        status: "failure",
        message: "Invalid or empty filters provided",
      });
    }

    // Fetch courses
    const courses = await Course.find(query).lean();

    if (courses.length === 0) {
      logger.info("No courses found matching the filters");
      return res.status(404).json({
        status: "failure",
        message: "No courses found matching the filters",
      });
    }

    logger.info(`Fetched ${courses.length} courses. Attaching feedback...`);

    // Attach feedback to each course
    const coursesWithFeedback = await Promise.all(
      courses.map(async (course) => {
        // Fetch feedback for the course
        const feedbacks = await Feedback.find({ courseId: course._id })
          .populate("userId", "name") // Populate user details
          .lean();

        // Format the feedback array
        const formattedFeedback = feedbacks.map((feedback) => ({
          name: feedback.userId.name,
          feedback: feedback.feedback,
          semester: course.semester, // Semester from the course
          year: course.year, // Year from the course
          date: feedback.createdDate.toISOString().split("T")[0], // Date in YYYY-MM-DD format
        }));

        return { ...course, feedback: formattedFeedback };
      })
    );

    logger.info(`Successfully fetched courses with feedback`);

    return res.status(200).json({
      status: "success",
      message: "Courses fetched successfully",
      values: coursesWithFeedback,
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
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!courseId) {
      logger.warn("Course ID is missing in the request parameters");
      return res.status(400).json({
        status: "failure",
        message: "Course ID is required",
      });
    }

    if (!mongoose.isValidObjectId(courseId)) {
      logger.warn(`Invalid Course ID format: ${courseId}`);
      return res.status(400).json({
        status: "failure",
        message: "Invalid Course ID format",
      });
    }

    // Fetch the course details and related feedback concurrently
    const [course, feedback] = await Promise.all([
      Course.findById(courseId).lean(),
      Feedback.find({ courseId })
        .populate("userId", "name") // Populate the name field from the User collection
        .lean(),
    ]);

    // Check if course exists
    if (!course) {
      logger.info(`Course with ID ${courseId} not found`);
      return res.status(404).json({
        status: "failure",
        message: "Course not found",
      });
    }

    // Enhance feedback array with user name and formatted date
    const feedbackWithDetails = feedback.map((f) => ({
      name: f.userId?.name || "Unknown", // Name of the user from User schema
      feedback: f.feedback,
      semester: course.semester,
      year: course.year,
      date: new Date(f.createdDate).toISOString().split("T")[0], // Extract only date from createdAt
    }));

    logger.info(
      `Course details and feedback fetched successfully for ID: ${courseId}`
    );
    return res.status(200).json({
      status: "success",
      message: "Course details and feedback fetched successfully",
      course,
      feedback: feedbackWithDetails,
    });
  } catch (error) {
    logger.error(
      `Error fetching course details for ID: ${req.params.courseId}`,
      { error: error.message }
    );
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
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

    // Process sheets concurrently
    const allData = (
      await Promise.all(
        sheets.map((sheetName) =>
          xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" })
        )
      )
    ).flat(); // Combine all parsed data into a single array

    if (allData.length === 0) {
      logger.warn("The Excel file contains no valid data");
      return res
        .status(400)
        .json({ message: "The Excel file contains no data" });
    }

    // Validate and filter rows
    const errors = [];
    const validCourses = [];

    allData.forEach((row, index) => {
      const filteredRow = {};
      Object.keys(row).forEach((key) => {
        if (requiredColumns.includes(key)) {
          if (
            ["prerequisites", "certificationRequirements", "category"].includes(
              key
            )
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

      const { error } = courseValidationSchema.validate(filteredRow, {
        abortEarly: false,
      });

      if (error) {
        errors.push({
          row: index + 2, // Adding 2 to account for header row and 0-based index
          message: error.details.map((err) => err.message),
        });
      } else {
        validCourses.push(filteredRow);
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

    // Process certificates in batches
    const batchProcess = async (items, batchSize, processFn) => {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.all(batch.map(processFn)); // Process each batch concurrently
      }
    };

    await batchProcess(validCourses, 10, async (course) => {
      const dbCourse = await Course.findOne({
        crn: course.crn,
        semester: course.semester,
        year: course.year,
      });

      if (dbCourse && course.certificationRequirements.length > 0) {
        console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeedbCourse", dbCourse);
        console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeecourse", course);
        await Promise.all(
          course.certificationRequirements.map(async (certName) => {
            console.log("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeecertName", certName);
            let certificate = await Certificate.findOne({ name: certName });
            if (certificate) {
              console.log(
                "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeecertificate",
                certificate
              );
              // Avoid duplicate course entries in the certificate
              const courseExists = certificate.requiredCourses.some(
                (c) => c.courseId.toString() === dbCourse._id.toString()
              );
              if (!courseExists) {
                certificate.requiredCourses.push({ courseId: dbCourse._id });
                await certificate.save();
                logger.info(
                  `Updated certificate: ${certName} with course: ${dbCourse.title}`
                );
              } else {
                logger.info(
                  `Course already exists in certificate: ${certName}`
                );
              }
            } else {
              try {
                const newCertificate = new Certificate({
                  name: certName,
                  requiredCourses: [{ courseId: dbCourse._id }],
                });
                await newCertificate.save();
                logger.info(
                  `Created new certificate: ${certName} with course: ${dbCourse.title}`
                );
              } catch (err) {
                if (err.code === 11000) {
                  logger.warn(`Duplicate certificate detected: ${certName}`);
                } else {
                  throw err;
                }
              }
            }
          })
        );
      }
    });

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

exports.validateCourseSelection1 = async (req, res) => {
  const userId = req?.user?.id;
  const { courseId } = req.params;

  try {
    if (!userId) {
      logger.warn("Missing user ID in JWT token");
      return res.status(401).json({
        status: "rejected",
        message: "Invalid token: User ID missing",
      });
    }

    if (!courseId) {
      logger.warn("Missing course ID in request");
      return res.status(400).json({
        status: "rejected",
        message: "courseId is required",
      });
    }

    // Convert IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    logger.info(
      `Validating course selection for user ID: ${userId}, course ID: ${courseId}`
    );

    // Fetch user's ProgramOfStudy and selected course concurrently
    const [programOfStudy, course] = await Promise.all([
      ProgramOfStudy.findOne({ userId: userObjectId }).lean(),
      Course.findById(courseObjectId).lean(),
    ]);

    if (!course) {
      logger.warn(`Course not found for ID: ${courseId}`);
      return res.status(404).json({
        status: "rejected",
        message: "Course not found",
      });
    }

    // Handle first-time registration
    if (!programOfStudy) {
      logger.info(`First-time registration for user ID: ${userId}`);
      return res.status(200).json({
        status: "fulfilled",
        data: {
          isValid: true,
          message: "First-time registration. No validation required.",
        },
      });
    }

    const plannedAndCompletedCourses =
      programOfStudy?.courses.filter(
        (c) => c.status === "Completed" || c.status === "Planned"
      ) || [];

    // Check if the course is already planned or completed
    const isAlreadyRegistered = plannedAndCompletedCourses.some(
      (c) => c.courseId.toString() === courseId
    );

    if (isAlreadyRegistered) {
      logger.info(
        `Course already registered for user ID: ${userId}, course ID: ${courseId}`
      );
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message: "This course is already planned or completed.",
        },
      });
    }

    // Calculate total credits and specific limits
    const { totalCredits, ceg6000Credits, coreCourseCount } =
      plannedAndCompletedCourses.reduce(
        (acc, c) => {
          acc.totalCredits += c.credits;
          if (
            c.courseId.subject === "CEG" ||
            c.courseId.course.startsWith("6")
          ) {
            acc.ceg6000Credits += c.credits;
          }
          if (["7200", "7370", "7100", "7140"].includes(c.courseId.course)) {
            acc.coreCourseCount++;
          }
          return acc;
        },
        { totalCredits: 0, ceg6000Credits: 0, coreCourseCount: 0 }
      );

    if (totalCredits >= 30) {
      logger.info(
        `Credits > 30. Expected credits for graduation reached for user ID: ${userId}`
      );
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message: "You have already registered 30 credits.",
        },
      });
    }

    // Skip validation for credits <= 12
    if (totalCredits <= 12) {
      logger.info(`Credits <= 12. Skipping validation for user ID: ${userId}`);
      return res.status(200).json({
        status: "fulfilled",
        data: {
          isValid: true,
          message: "Credits <= 12. No validation required.",
        },
      });
    }

    // Validate CEG/6000-Level Credit Limit
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

    // Validate core course requirements if totalCredits >= 24
    if (totalCredits >= 24) {
      const isCoreCourse = ["7200", "7370", "7100", "7140"].includes(
        course.course
      );
      if (coreCourseCount === 0 && !isCoreCourse) {
        logger.info(
          `Credits >= 24. Core course required for user ID: ${userId}`
        );
        return res.status(400).json({
          status: "fulfilled",
          data: {
            isValid: false,
            message: "Credits >= 24. You must take a core course.",
          },
        });
      }

      if (coreCourseCount === 1 && totalCredits + course.credits > 27) {
        logger.info(
          `Credits >= 27. Additional core course required for user ID: ${userId}`
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

    logger.info(
      `Course selection validated successfully for user ID: ${userId}`
    );
    return res.status(200).json({
      status: "fulfilled",
      data: {
        isValid: true,
        message: "Course selection is valid.",
      },
    });
  } catch (error) {
    logger.error(
      `Error validating course selection for user ID: ${userId}`,
      error
    );
    return res.status(500).json({
      status: "rejected",
      message: "Internal server error",
    });
  }
};

exports.validateCourseSelection = async (req, res) => {
  const userId = req?.user?.id;
  const { courseId } = req.params;

  try {
    if (!userId) {
      logger.warn("Missing user ID in JWT token");
      return res.status(401).json({
        status: "rejected",
        message: "Invalid token: User ID missing",
      });
    }

    if (!courseId) {
      logger.warn("Missing course ID in request");
      return res.status(400).json({
        status: "rejected",
        message: "courseId is required",
      });
    }

    // Convert IDs to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    logger.info(
      `Validating course selection for user ID: ${userId}, course ID: ${courseId}`
    );

    // Fetch user's ProgramOfStudy and selected course concurrently
    const [programOfStudy, course] = await Promise.all([
      ProgramOfStudy.findOne({ userId: userObjectId })
        .populate("courses.courseId", "course subject credits") // Populate course details
        .lean(),
      Course.findById(courseObjectId).lean(),
    ]);

    if (!course) {
      logger.warn(`Course not found for ID: ${courseId}`);
      return res.status(404).json({
        status: "rejected",
        message: "Course not found",
      });
    }

    // Handle first-time registration
    if (!programOfStudy) {
      logger.info(`First-time registration for user ID: ${userId}`);
      return res.status(200).json({
        status: "fulfilled",
        data: {
          isValid: true,
          message: "First-time registration. No validation required.",
        },
      });
    }

    const plannedAndCompletedCourses =
      programOfStudy?.courses.filter(
        (c) => c.status === "Completed" || c.status === "Planned"
      ) || [];

    // Validate if the course ID is already registered
    const isAlreadyRegistered = plannedAndCompletedCourses.some(
      (c) => c.courseId && c.courseId._id.toString() === courseId
    );

    if (isAlreadyRegistered) {
      logger.info(
        `Course already registered for user ID: ${userId}, course ID: ${courseId}`
      );
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message: "This course is already planned or completed.",
        },
      });
    }

    // Validate if the same course number is already registered in another semester/year
    const isSameCourseNumberRegistered = plannedAndCompletedCourses.some(
      (c) => c.courseId && c.courseId.course === course.course
    );

    if (isSameCourseNumberRegistered) {
      logger.info(
        `Same course number already registered for user ID: ${userId}, course number: ${course.course}`
      );
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message: `You have already registered for the course ${course.course} in another semester/year.`,
        },
      });
    }

    // Calculate total credits and specific limits
    const { totalCredits, ceg6000Credits, coreCourseCount } =
      plannedAndCompletedCourses.reduce(
        (acc, c) => {
          acc.totalCredits += c.courseId.credits;
          if (
            c.courseId.subject === "CEG" ||
            c.courseId.course.startsWith("6")
          ) {
            acc.ceg6000Credits += c.courseId.credits;
          }
          if (["7200", "7370", "7100", "7140"].includes(c.courseId.course)) {
            acc.coreCourseCount++;
          }
          return acc;
        },
        { totalCredits: 0, ceg6000Credits: 0, coreCourseCount: 0 }
      );

    // Check if total credits exceed graduation limit
    if (totalCredits + course.credits > 30) {
      logger.info(
        `Credits > 30. Expected credits for graduation reached for user ID: ${userId}`
      );
      return res.status(400).json({
        status: "fulfilled",
        data: {
          isValid: false,
          message: "You have already registered 30 credits.",
        },
      });
    }

    // Validate CEG/6000-Level Credit Limit
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

    // Validate core course requirements if totalCredits >= 24
    if (totalCredits >= 24) {
      const isCoreCourse = ["7200", "7370", "7100", "7140"].includes(
        course.course
      );
      if (coreCourseCount === 0 && !isCoreCourse) {
        logger.info(
          `Credits >= 24. Core course required for user ID: ${userId}`
        );
        return res.status(400).json({
          status: "fulfilled",
          data: {
            isValid: false,
            message: "Credits >= 24. You must take a core course.",
          },
        });
      }

      if (coreCourseCount === 1 && totalCredits + course.credits > 27) {
        logger.info(
          `Credits >= 27. Additional core course required for user ID: ${userId}`
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

    logger.info(
      `Course selection validated successfully for user ID: ${userId}`
    );
    return res.status(200).json({
      status: "fulfilled",
      data: {
        isValid: true,
        message: "Course selection is valid.",
      },
    });
  } catch (error) {
    logger.error(
      `Error validating course selection for user ID: ${userId}`,
      error
    );
    return res.status(500).json({
      status: "rejected",
      message: "Internal server error",
    });
  }
};

exports.getEnumValues = async (req, res) => {
  logger.info("Fetching enum values for the course schema...");
  try {
    const schemaPaths = Course.schema.paths;

    if (!schemaPaths) {
      logger.error("Course schema paths not found");
      return res.status(500).json({
        status: "failure",
        message: "Course schema paths not found",
      });
    }

    // Fetch enum values in one go
    const enums = {
      subject: schemaPaths.subject?.enumValues || [],
      campus: schemaPaths.campus?.enumValues || [],
      semester: schemaPaths.semester?.enumValues || [],
      level: schemaPaths.level?.enumValues || [],
      category: schemaPaths.category?.caster?.enumValues || [],
      certificationRequirements:
        schemaPaths.certificationRequirements?.caster?.enumValues || [],
      status: schemaPaths.status?.enumValues || [],
    };

    // Log count of fetched enums instead of full values to reduce log size
    logger.info(
      `Enum values fetched successfully. Counts: ${Object.keys(enums)
        .map((key) => `${key}: ${enums[key].length}`)
        .join(", ")}`
    );

    return res.status(200).json({
      status: "success",
      message: "Enum values fetched successfully",
      values: enums,
    });
  } catch (error) {
    logger.error("Error fetching enum values", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error while fetching enum values",
    });
  }
};

exports.updateCourseCompletion = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { courseId, course, title, grade, marks, totalMarks, feedback } = req.body;

    if (!userId || !courseId || !course || !title) {
      logger.warn("Invalid input: userId, courseId, course, and title are required");
      return res.status(400).json({
        statusCode: 400,
        status: "failure",
        message: "userId, courseId, course, and title are required",
      });
    }

    const validGrades = ["A", "B", "C", "D", "F"];
    const gradeToPoints = {
      A: 4.0,
      B: 3.0,
      C: 2.0,
      D: 1.0,
      F: 0.0,
    };

    // Validate grade
    if (grade && !validGrades.includes(grade)) {
      logger.warn(`Invalid grade: ${grade} for courseId: ${courseId}`);
      return res.status(400).json({
        statusCode: 400,
        status: "failure",
        message: `Invalid grade: ${grade}`,
      });
    }

    // Validate marks
    if (marks !== undefined && totalMarks !== undefined && marks > totalMarks) {
      logger.warn(
        `Marks (${marks}) cannot exceed totalMarks (${totalMarks}) for courseId: ${courseId}`
      );
      return res.status(400).json({
        status: "failure",
        message: `Marks cannot exceed totalMarks`,
      });
    }

    // Fetch the program of study for the user
    const programOfStudy = await ProgramOfStudy.findOne({ userId });
    if (!programOfStudy) {
      logger.warn(`Program of study not found for userId: ${userId}`);
      return res
        .status(404)
        .json({ status: "failure", message: "Program of study not found" });
    }

    // Find the course in the program of study
    const courseData = programOfStudy.courses.find(
      (c) => c.courseId.toString() === courseId
    );

    if (!courseData) {
      logger.warn(
        `CourseId: ${courseId} not found in program of study for userId: ${userId}`
      );
      return res.status(400).json({
        status: "failure",
        message: "Course not found in program of study",
      });
    }

    // Update course details
    if (grade) courseData.grade = grade;
    if (marks !== undefined) courseData.marks = marks;
    if (totalMarks !== undefined) courseData.totalMarks = totalMarks;
    courseData.status = "Completed";

    // Update feedback if provided
    if (feedback) {
      await Feedback.findOneAndUpdate(
        { userId, courseId, course, title },
        {
          $set: { feedback, updatedDate: Date.now() },
          $setOnInsert: { createdDate: Date.now() },
        },
        { new: true, upsert: true }
      );
      logger.info(
        `Feedback updated for userId: ${userId}, courseId: ${courseId}`
      );
    }

    // Recalculate GPA for completed courses
    const completedCourses = programOfStudy.courses.filter(
      (c) => c.status === "Completed" && gradeToPoints[c.grade] !== undefined
    );

    const totalGradePoints = completedCourses.reduce(
      (sum, c) => sum + gradeToPoints[c.grade],
      0
    );

    const totalCourses = completedCourses.length;

    programOfStudy.gpa =
      totalCourses > 0
        ? parseFloat((totalGradePoints / totalCourses).toFixed(2))
        : 0;

    // Update overall completion status
    programOfStudy.completionStatus = programOfStudy.courses.every(
      (c) => c.status === "Completed"
    )
      ? "Completed"
      : "In Progress";

    // Save the updated program of study
    await programOfStudy.save();

    logger.info(`Successfully updated course completion for userId: ${userId}`);
    return res.status(200).json({
      status: "success",
      message: "Course updated and GPA recalculated successfully",
      gpa: programOfStudy.gpa,
    });
  } catch (error) {
    logger.error(`Error updating course completion for userId: ${userId}`, {
      error: error.message,
    });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};

exports.registerCourses = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { courseIds } = req.body; // Array of course IDs

    if (!userId || !Array.isArray(courseIds) || courseIds.length === 0) {
      logger.warn("Invalid input: userId or courseIds array is missing");
      return res.status(400).json({
        status: "failure",
        message: "userId and courseIds array are required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch or create the program of study
    const programOfStudy = await ProgramOfStudy.findOneAndUpdate(
      { userId: userObjectId },
      {
        $setOnInsert: {
          userId: userObjectId,
          courses: [],
          totalCredits: 0,
          coreCredits: 0,
          csCredits: 0,
          cegCredits: 0,
          upperLevelCredits: 0,
          lowerLevelCredits: 0,
          independentStudyCredits: 0,
          firstSemester: {
            semester: "",
            year: "",
          },
          completionStatus: "In Progress",
        },
      },
      { new: true, upsert: true }
    );

    const coreCourses = ["7200", "7370", "7100", "7140"];
    const results = [];
    let updatedTotalCredits = programOfStudy.totalCredits;
    let updatedCoreCredits = programOfStudy.coreCredits;
    let updatedCsCredits = programOfStudy.csCredits;
    let updatedCegCredits = programOfStudy.cegCredits;
    let updatedUpperLevelCredits = programOfStudy.upperLevelCredits;
    let updatedLowerLevelCredits = programOfStudy.lowerLevelCredits;

    for (const courseId of courseIds) {
      try {
        const courseObjectId = new mongoose.Types.ObjectId(courseId);

        // Fetch the course to register
        const courseToRegister = await Course.findById(courseObjectId).lean();
        if (!courseToRegister) {
          results.push({
            courseId,
            courseTitle: null,
            status: "failure",
            reason: "Course not found",
          });
          continue;
        }
        const courseTitle = courseToRegister.title;
        // Stop registering if total credits have already reached 30
        if (updatedTotalCredits >= 30) {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "Graduation limit credits reached (30 credits)",
          });
          continue;
        }

        if (courseToRegister.status !== "open") {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "Course is not open for registration",
          });
          continue;
        }

        // Check duplicate registration
        if (
          programOfStudy.courses.some(
            (c) => c.courseId.toString() === courseId && c.status !== "Dropped"
          )
        ) {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "Course already registered",
          });
          continue;
        }

        // Set the first semester if not already set
        if (
          !programOfStudy.firstSemester.semester ||
          !programOfStudy.firstSemester.year
        ) {
          programOfStudy.firstSemester = {
            semester: courseToRegister.semester,
            year: courseToRegister.year,
          };
        }

        // Map semesters to numeric values for proper comparison
        const semesterOrder = {
          spring: 1,
          summer: 2,
          fall: 3,
        };

        // Validate semester/year constraints
        if (
          programOfStudy?.firstSemester?.semester &&
          programOfStudy?.firstSemester?.year
        ) {
          const firstSemesterYear = parseInt(
            programOfStudy.firstSemester.year,
            10
          );
          const firstSemesterValue =
            semesterOrder[programOfStudy.firstSemester.semester];
          const courseYear = parseInt(courseToRegister.year, 10);
          const courseSemesterValue = semesterOrder[courseToRegister.semester];

          if (
            courseYear < firstSemesterYear ||
            (courseYear === firstSemesterYear &&
              courseSemesterValue < firstSemesterValue)
          ) {
            results.push({
              courseId,
              courseTitle,
              status: "failure",
              reason:
                "Course semester/year must be equal or greater than the first semester and year",
            });
            continue;
          }
        }

        // Handle first semester and other semester restrictions
        const isFirstSemester =
          courseToRegister.semester ===
            programOfStudy?.firstSemester?.semester &&
          courseToRegister.year === programOfStudy?.firstSemester?.year;

        const semesterCourses = programOfStudy.courses.filter(
          (c) =>
            c.status !== "Dropped" &&
            c.semesterTaken === courseToRegister.semester &&
            c.yearTaken === courseToRegister.year
        );

        if (isFirstSemester && semesterCourses.length >= 2) {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "First semester limit of 2 courses reached",
          });
          continue;
        }

        if (!isFirstSemester && semesterCourses.length >= 3) {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "Semester limit of 3 courses reached",
          });
          continue;
        }

        // Check for available seats
        const sectionRemaining =
          parseInt(courseToRegister.sectionRemaining, 10) || 0;

        const sectionActual = parseInt(courseToRegister.sectionActual, 10) || 0;

        if (sectionRemaining <= 0) {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "No remaining seats for the course",
          });
          continue;
        }

        // Check for schedule conflicts
        if (courseToRegister.attribute === "Face-to-Face") {
          const conflictingCourse = programOfStudy.courses.find((c) => {
            if (!c.courseId) return false;
            // Exclude "Dropped" courses
            if (c.status !== "Planned" && c.status !== "Completed")
              return false;

            const isSameSemester =
              c.semesterTaken === courseToRegister.semester &&
              c.yearTaken === courseToRegister.year;

            const isSameDays = c.days === courseToRegister.days;
            const isSameAttribute = c.attribute === courseToRegister.attribute;

            if (!isSameSemester || !isSameDays || !isSameAttribute)
              return false;

            const [startA, endA] = courseToRegister.time
              .split("-")
              .map((time) => {
                const [hours, minutes] = time.split(":").map(Number);
                return hours * 60 + minutes;
              });
            const [startB, endB] = c.time.split("-").map((time) => {
              const [hours, minutes] = time.split(":").map(Number);
              return hours * 60 + minutes;
            });

            return (
              (startA >= startB && startA < endB) ||
              (endA > startB && endA <= endB) ||
              (startA <= startB && endA >= endB)
            );
          });

          if (conflictingCourse) {
            results.push({
              courseId,
              courseTitle,
              status: "failure",
              reason: "This course conflicts with another registered course",
            });
            continue;
          }
        }

        // Update course seat counts and status if needed
        const updatedCourse = await Course.findByIdAndUpdate(
          courseObjectId,
          {
            $set: {
              sectionActual: sectionActual + 1,
              sectionRemaining: sectionRemaining - 1,
              ...(sectionRemaining - 1 === 0 && { status: "closed" }),
            },
          },
          { new: true }
        );

        if (!updatedCourse) {
          results.push({
            courseId,
            courseTitle,
            status: "failure",
            reason: "Failed to update course seat counts",
          });
          continue;
        }

        // Update program of study details
        const credits = parseInt(courseToRegister.credits, 10) || 0;
        updatedTotalCredits += credits;
        updatedCoreCredits += coreCourses.includes(courseToRegister.course)
          ? credits
          : 0;
        updatedCsCredits += courseToRegister.subject === "CS" ? credits : 0;
        updatedCegCredits += courseToRegister.subject === "CEG" ? credits : 0;
        updatedUpperLevelCredits +=
          courseToRegister.course.startsWith("7") ||
          courseToRegister.course.startsWith("8")
            ? credits
            : 0;
        updatedLowerLevelCredits += courseToRegister.course.startsWith("6")
          ? credits
          : 0;

        // Add to program of study courses
        programOfStudy.courses.push({
          courseId: courseObjectId,
          status: "Planned",
          semesterTaken: courseToRegister.semester,
          yearTaken: courseToRegister.year,
          credits,
          days: courseToRegister.days,
          time: courseToRegister.time,
          attribute: courseToRegister.attribute,
        });
        programOfStudy.totalCredits = updatedTotalCredits;
        programOfStudy.coreCredits = updatedCoreCredits;
        programOfStudy.csCredits = updatedCsCredits;
        programOfStudy.cegCredits = updatedCegCredits;
        programOfStudy.upperLevelCredits = updatedUpperLevelCredits;
        programOfStudy.lowerLevelCredits = updatedLowerLevelCredits;
        programOfStudy.completionStatus =
          updatedTotalCredits >= 30 ? "Completed" : "In Progress";

        await programOfStudy.save();

        results.push({
          courseId,
          courseTitle,
          status: "success",
          message: "Course registered successfully",
        });
      } catch (err) {
        logger.error(`Error registering course ${courseId}: ${err.message}`);
        results.push({
          courseId,
          status: "failure",
          reason: "Unexpected error occurred",
        });
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Courses processed",
      results,
    });
  } catch (error) {
    logger.error("Error processing course registrations", {
      error: error.message,
    });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};

exports.getProgramOfStudy = async (req, res) => {
  try {
    const userId = req?.user?.id;

    if (!userId) {
      logger.warn("Missing userId in request");
      return res.status(400).json({
        status: "failure",
        message: "User ID is required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch the program of study for the user with the required fields
    const programOfStudy = await ProgramOfStudy.findOne({
      userId: userObjectId,
    })
      .populate(
        "courses.courseId",
        "crn subject course title credits semester year attribute days time instructor"
      )
      .lean();

    if (!programOfStudy) {
      logger.info(`No program of study found for user ID: ${userId}`);
      return res.status(404).json({
        status: "failure",
        message: "Program of study not found",
      });
    }

    // Transform the response to include only courseId as a string
    programOfStudy.courses = programOfStudy.courses.map((course) => {
      const { courseId, ...rest } = course;
      return {
        ...rest,
        courseId: courseId?._id?.toString() || null, // Include only the courseId
        ...courseId, // Merge the populated fields from the courseId
      };
    });

    logger.info(`Program of study fetched successfully for user ID: ${userId}`);
    return res.status(200).json({
      status: "success",
      message: "Program of study fetched successfully",
      data: programOfStudy,
    });
  } catch (error) {
    logger.error(
      `Error fetching program of study for user ID: ${
        req?.user?.id || "unknown"
      }`,
      { error: error.message }
    );
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};

exports.deleteCourse = async (req, res) => {
  const userId = req?.user?.id;
  const { courseId } = req.params;

  try {
    if (!userId) {
      logger.warn("Missing user ID in JWT token");
      return res.status(401).json({
        status: "rejected",
        message: "Invalid token: User ID missing",
      });
    }

    if (!courseId) {
      logger.warn("Missing course ID in request");
      return res.status(400).json({
        status: "rejected",
        message: "courseId is required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    logger.info(
      `Validating course removal for user ID: ${userId}, course ID: ${courseId}`
    );

    // Fetch the program of study and the course concurrently
    const [programOfStudy, courseToDelete] = await Promise.all([
      ProgramOfStudy.findOne({ userId: userObjectId }),
      Course.findById(courseObjectId),
    ]);

    if (!programOfStudy) {
      logger.warn(`Program of study not found for user ID: ${userId}`);
      return res.status(404).json({
        status: "failure",
        message: "Program of study not found",
      });
    }

    if (!courseToDelete) {
      logger.warn(`Course not found for ID: ${courseId}`);
      return res.status(404).json({
        status: "failure",
        message: "Course not found",
      });
    }

    // Find the course in the program of study
    const courseInProgram = programOfStudy.courses.find(
      (c) => c.courseId.toString() === courseId
    );

    if (!courseInProgram) {
      logger.warn(
        `Course ID ${courseId} not found in program of study for user ID: ${userId}`
      );
      return res.status(400).json({
        status: "failure",
        message: "Course not found in your program of study",
      });
    }

    // Validate if the course is already completed
    if (courseInProgram.status === "Completed") {
      logger.info(
        `Cannot delete completed course for user ID: ${userId}, course ID: ${courseId}`
      );
      return res.status(400).json({
        status: "failure",
        message: "Cannot delete a completed course",
      });
    }

    // Remove the course from program of study
    programOfStudy.courses = programOfStudy.courses.filter(
      (c) => c.courseId.toString() !== courseId
    );

    // Update total credits and other program-specific fields
    const removedCredits = courseInProgram.credits;
    programOfStudy.totalCredits -= removedCredits;

    if (courseToDelete.subject === "CS") {
      programOfStudy.csCredits -= removedCredits;
    } else if (courseToDelete.subject === "CEG") {
      programOfStudy.cegCredits -= removedCredits;
    }

    if (
      courseToDelete.course.startsWith("7") ||
      courseToDelete.course.startsWith("8")
    ) {
      programOfStudy.upperLevelCredits -= removedCredits;
    } else if (courseToDelete.course.startsWith("6")) {
      programOfStudy.lowerLevelCredits -= removedCredits;
    }

    // Update the overall completion status if totalCredits is less than 30
    programOfStudy.completionStatus =
      programOfStudy.totalCredits >= 30 ? "Completed" : "In Progress";

    // Save the updated program of study
    await programOfStudy.save();

    // Update the course details (increment available seats)
    const sectionRemaining = parseInt(courseToDelete.sectionRemaining, 10) || 0;
    const sectionActual = parseInt(courseToDelete.sectionActual, 10) || 0;

    await Course.findByIdAndUpdate(courseObjectId, {
      $set: {
        sectionRemaining: sectionRemaining + 1,
        sectionActual: sectionActual - 1,
        ...(sectionRemaining + 1 > 0 && { status: "open" }), // Reopen the course if seats become available
      },
    });

    logger.info(
      `Successfully deleted course ${courseId} for user ID: ${userId}`
    );
    return res.status(200).json({
      status: "success",
      message: "Course deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting course for user ID: ${userId}`, {
      error: error.message,
    });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};

exports.isFirstSemester = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { semester, year } = req.body;

    if (!userId) {
      logger.warn("User ID missing in JWT token");
      return res.status(401).json({
        status: "failure",
        message: "Invalid token: User ID missing",
      });
    }

    if (!semester || !year) {
      logger.warn("Semester and/or year is missing in the request body");
      return res.status(400).json({
        status: "failure",
        message: "Both semester and year are required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch the program of study for the user
    const programOfStudy = await ProgramOfStudy.findOne(
      { userId: userObjectId },
      { firstSemester: 1 } // Project only the firstSemester field
    ).lean();

    if (
      !programOfStudy ||
      !programOfStudy.firstSemester?.semester ||
      !programOfStudy.firstSemester?.year
    ) {
      logger.info(`First semester not found for user ID: ${userId}`);
      return res.status(404).json({
        status: "failure",
        message: "First semester not found for the user",
      });
    }

    // Check if the input semester and year match the first semester
    const isMatch =
      programOfStudy.firstSemester.semester.toLowerCase() ===
        semester.toLowerCase() && programOfStudy.firstSemester.year === year;

    logger.info(
      `Checked first semester for user ID: ${userId} - Result: ${isMatch}`
    );
    return res.status(200).json({
      status: "success",
      message: "First semester comparison completed successfully",
      isFirstSemester: isMatch,
    });
  } catch (error) {
    logger.error("Error validating first semester", { error: error.message });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};
