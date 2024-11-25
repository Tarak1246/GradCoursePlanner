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
  try {
    const { courseId } = req.params;

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

    const course = await Course.findById(courseId).lean();

    if (!course) {
      logger.info(`Course with ID ${courseId} not found`);
      return res.status(404).json({
        status: "failure",
        message: "Course not found",
      });
    }

    logger.info(`Course details fetched successfully for ID: ${courseId}`);
    return res.status(200).json({
      status: "success",
      message: "Course details fetched successfully",
      course,
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
        await Promise.all(
          course.certificationRequirements.map(async (certName) => {
            let certificate = await Certificate.findOne({ name: certName });

            if (certificate) {
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

    if(totalCredits >= 30) {
      logger.info(`Credits > 30. Expected credits for graduation reached for user ID: ${userId}`);
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
    const { courses } = req.body; // Expecting an array of course updates: [{ courseId, grade, marks, totalMarks }]

    if (!userId || !Array.isArray(courses) || courses.length === 0) {
      logger.warn("Invalid input: userId or courses array is missing");
      return res.status(400).json({
        status: "failure",
        message: "userId and courses array with course details are required",
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

    // Fetch program of study for the user
    const programOfStudy = await ProgramOfStudy.findOne({ userId });
    if (!programOfStudy) {
      logger.warn(`Program of study not found for userId: ${userId}`);
      return res
        .status(404)
        .json({ status: "failure", message: "Program of study not found" });
    }

    // Track changes for logging and efficiency
    let isUpdated = false;

    // Iterate over courses to update
    for (const { courseId, grade, marks, totalMarks, courseName } of courses) {
      if (!validGrades.includes(grade)) {
        logger.warn(
          `Invalid grade provided: ${grade} for courseId: ${courseId}`
        );
        return res.status(400).json({
          status: "failure",
          message: `Invalid grade provided: ${grade} for course: ${courseName}`,
        });
      }
      if (
        marks !== undefined &&
        totalMarks !== undefined &&
        marks > totalMarks
      ) {
        logger.warn(`Marks cannot exceed totalMarks for courseId: ${courseId}`);
        return res.status(400).json({
          status: "failure",
          message: `Marks cannot exceed totalMarks for course: ${courseName}`,
        });
      }

      // Find the course in the program of study
      const course = programOfStudy.courses.find(
        (c) => c.courseId.toString() === courseId
      );
      if (!course) {
        logger.warn(
          `CourseId: ${courseId} not found in program of study for userId: ${userId}`
        );
        return res.status(400).json({
          status: "failure",
          message: `Course: ${courseName} not found in program of study`,
        });
      }

      // Update course details
      course.status = "Completed";
      course.grade = grade;
      course.marks = marks !== undefined ? marks : course.marks;
      course.totalMarks =
        totalMarks !== undefined ? totalMarks : course.totalMarks;

      isUpdated = true; // Mark that we updated at least one course
    }

    if (!isUpdated) {
      logger.warn(`No valid courses to update for userId: ${userId}`);
      return res
        .status(400)
        .json({ status: "failure", message: "No valid courses to update" });
    }

    const completedCourses = programOfStudy.courses.filter(
      (c) => c.status === "Completed" && gradeToPoints[c.grade] !== undefined
    );

    // Calculate GPA based on grades only (simple average of grade points)
    const totalGradePoints = completedCourses.reduce((sum, c) => {
      return sum + gradeToPoints[c.grade];
    }, 0);

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

    // Save the program of study
    await programOfStudy.save();

    logger.info(`Successfully updated courses and GPA for userId: ${userId}`);
    return res.status(200).json({
      status: "success",
      message: "Courses updated and GPA calculated successfully",
      gpa: programOfStudy.gpa,
    });
  } catch (error) {
    logger.error("Error updating course completion:", error);
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};

exports.registerCourse = async (req, res) => {
  try {
    const userId = req?.user?.id;
    const { courseId } = req.params;

    if (!userId || !courseId) {
      logger.warn("Missing required fields: userId or courseId");
      return res.status(400).json({
        status: "failure",
        message: "userId and courseId are required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // Fetch the course to register
    const courseToRegister = await Course.findById(courseObjectId).lean();
    if (!courseToRegister) {
      logger.warn(`Course not found with ID: ${courseId}`);
      return res.status(404).json({
        status: "failure",
        message: "Course not found",
      });
    }

    if (courseToRegister.status !== "open") {
      logger.info(
        `Course ${courseId} is not open for registration (Status: ${courseToRegister.status})`
      );
      return res.status(400).json({
        status: "failure",
        message: "This course is not open for registration",
      });
    }

    // Check or create the program of study
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
          firstSemester: {},
          completionStatus: "In Progress",
        },
      },
      { new: true, upsert: true }
    );

    // Check for duplicate registration
    if (
      programOfStudy.courses.some(
        (c) => c.courseId.toString() === courseId && c.status !== "Dropped"
      )
    ) {
      logger.info(
        `Course ${courseId} is already registered for user ID: ${userId}`
      );
      return res.status(400).json({
        status: "failure",
        message: "You have already registered for this course",
      });
    }

    // Handle first semester restrictions
    if (!programOfStudy.firstSemester.semester) {
      // Set the first semester if not already defined
      programOfStudy.firstSemester = {
        semester: courseToRegister.semester,
        year: courseToRegister.year,
      };
    } else if (
      courseToRegister.semester === programOfStudy.firstSemester.semester &&
      courseToRegister.year === programOfStudy.firstSemester.year
    ) {
      // Restrict to two courses in the first semester
      const firstSemesterCourses = programOfStudy.courses.filter(
        (c) =>
          c.semesterTaken === programOfStudy.firstSemester.semester &&
          c.yearTaken === programOfStudy.firstSemester.year
      );

      if (firstSemesterCourses.length >= 2) {
        logger.info(
          `First semester course limit reached for user ID: ${userId}`
        );
        return res.status(400).json({
          status: "failure",
          message:
            "You can only register for two courses in your first semester.",
        });
      }
    }

    // Check for schedule conflicts
    if (courseToRegister.attribute === "Face-to-Face") {
      const conflictingCourse = programOfStudy.courses.find((c) => {
        if (!c.courseId) return false;

        const isSameSemester =
          c.semesterTaken === courseToRegister.semester &&
          c.yearTaken === courseToRegister.year;

        const isSameDays = c.days === courseToRegister.days;
        const isSameAttribute = c.attribute === courseToRegister.attribute;

        if (!isSameSemester || !isSameDays || !isSameAttribute) return false;

        const [startA, endA] = courseToRegister.time.split("-").map((time) => {
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
        logger.info(
          `Course ${courseId} conflicts with another registered course for user ID: ${userId}`
        );
        return res.status(400).json({
          status: "failure",
          message: "This course conflicts with another registered course.",
        });
      }
    }

    // Check for available seats
    const sectionRemaining =
      parseInt(courseToRegister.sectionRemaining, 10) || 0;
    const sectionActual = parseInt(courseToRegister.sectionActual, 10) || 0;

    if (sectionRemaining <= 0) {
      logger.info(
        `Course ${courseId} has no remaining seats for user ID: ${userId}`
      );
      return res.status(400).json({
        status: "failure",
        message: "This course has no remaining seats",
      });
    }

    // Update course seat counts
    const updatedCourse = await Course.findByIdAndUpdate(
      courseObjectId,
      {
        $set: {
          sectionRemaining: sectionRemaining - 1,
          sectionActual: sectionActual + 1,
        },
      },
      { new: true }
    );

    if (!updatedCourse) {
      logger.error(
        `Failed to update course details for course ID: ${courseId}`
      );
      return res.status(500).json({
        status: "failure",
        message: "Failed to register for the course. Please try again later.",
      });
    }

    // Register the course in the program of study
    programOfStudy.courses.push({
      courseId: courseObjectId,
      status: "Planned",
      semesterTaken: courseToRegister.semester,
      yearTaken: courseToRegister.year,
      credits: parseInt(courseToRegister.credits, 10),
      days: courseToRegister.days,
      time: courseToRegister.time,
      attribute: courseToRegister.attribute,
    });

    // Update total credits and other metrics
    const credits = parseInt(courseToRegister.credits, 10) || 0;
    programOfStudy.totalCredits += credits;
    programOfStudy.csCredits += courseToRegister.subject === "CS" ? credits : 0;
    programOfStudy.cegCredits +=
      courseToRegister.subject === "CEG" ? credits : 0;
    programOfStudy.upperLevelCredits +=
      courseToRegister.course.startsWith("7") ||
      courseToRegister.course.startsWith("8")
        ? credits
        : 0;
    programOfStudy.lowerLevelCredits += courseToRegister.course.startsWith("6")
      ? credits
      : 0;

    await programOfStudy.save();

    logger.info(
      `Successfully registered course ${courseId} for user ID: ${userId}`
    );
    return res.status(200).json({
      status: "success",
      message: "Course registered successfully",
    });
  } catch (error) {
    logger.error("Error registering course:", { error: error.message });
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
      `Error fetching program of study for user ID: ${req?.user?.id || "unknown"}`,
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

    logger.info(`Validating course removal for user ID: ${userId}, course ID: ${courseId}`);

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
      logger.warn(`Course ID ${courseId} not found in program of study for user ID: ${userId}`);
      return res.status(400).json({
        status: "failure",
        message: "Course not found in your program of study",
      });
    }

    // Validate if the course is already completed
    if (courseInProgram.status === "Completed") {
      logger.info(`Cannot delete completed course for user ID: ${userId}, course ID: ${courseId}`);
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

    if (courseToDelete.course.startsWith("7") || courseToDelete.course.startsWith("8")) {
      programOfStudy.upperLevelCredits -= removedCredits;
    } else if (courseToDelete.course.startsWith("6")) {
      programOfStudy.lowerLevelCredits -= removedCredits;
    }

    // Save the updated program of study
    await programOfStudy.save();

    // Update the course details (increment available seats)
    const sectionRemaining = parseInt(courseToDelete.sectionRemaining, 10) || 0;
    const sectionActual = parseInt(courseToDelete.sectionActual, 10) || 0;

    await Course.findByIdAndUpdate(courseObjectId, {
      $set: {
        sectionRemaining: sectionRemaining + 1,
        sectionActual: sectionActual - 1,
      },
    });

    logger.info(`Successfully deleted course ${courseId} for user ID: ${userId}`);
    return res.status(200).json({
      status: "success",
      message: "Course deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting course for user ID: ${userId}`, { error: error.message });
    return res.status(500).json({
      status: "failure",
      message: "Internal server error",
    });
  }
};


