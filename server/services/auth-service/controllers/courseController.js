const xlsx = require("xlsx");
const Course = require("../../../common/models/Course");
const { courseValidationSchema } = require("../validators/courseValidator");
const logger = require("../../../common/utils/logger");

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
            return res.status(400).json({ message: "Only one file is allowed. Please upload a single Excel file." });
        }
        
        const file = req.files.file;

        // Validate the file type (ensure it's an Excel file)
        if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            logger.warn(`Invalid file type uploaded: ${file.name}`);
            return res.status(400).json({ message: "Invalid file type. Only Excel files are supported." });
        }

        // Read the Excel file
        const workbook = xlsx.read(file.data, { type: "buffer" });
        const sheets = workbook.SheetNames;

        if (sheets.length === 0) {
            logger.warn("Uploaded Excel file contains no sheets");
            return res.status(400).json({ message: "The Excel file contains no sheets" });
        }

        const requiredColumns = [
            "crn", "subject", "course", "section", "campus", "semester", "year",
            "level", "title", "credits", "days", "time", "prerequisites", "category",
            "certificationRequirements", "sectionCapacity", "sectionActual", "sectionRemaining",
            "waitlistCapacity", "waitlistActual", "waitlistRemaining", "crosslistCapacity",
            "crosslistActual", "crosslistRemaining", "instructor", "duration",
            "location", "attribute", "restrictions", "status",
        ];

        let allData = [];

        // Process all sheets
        sheets.forEach((sheetName) => {
            const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

            sheetData.forEach((row) => {
                // Only keep required columns and filter out extra columns
                const filteredRow = {};
                Object.keys(row).forEach((key) => {
                    if (requiredColumns.includes(key)) {
                        // Handle arrays for specific fields
                        if (["prerequisites", "certificationRequirements", "category"].includes(key)) {
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
            return res.status(400).json({ message: "The Excel file contains no data" });
        }

        // Validate each row
        const errors = [];
        const validCourses = [];

        allData.forEach((row, index) => {
            const { error } = courseValidationSchema.validate(row, { abortEarly: false });

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
            logger.warn(`Validation errors in uploaded Excel file: ${errors.length} rows affected`);
            return res.status(400).json({ message: "Validation errors", errors });
        }

        // Add or Update courses in the database
        const bulkOps = validCourses.map((course) => ({
            updateOne: {
                filter: { crn: course.crn, semester: course.semester, year: course.year },
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
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
