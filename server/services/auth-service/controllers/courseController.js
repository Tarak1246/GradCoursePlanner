const xlsx = require("xlsx");
const Course = require("../models/Course");
const { courseValidationSchema } = require("../validators/courseValidator");
const logger = require("../utils/logger");

exports.addOrModifyCourses = async (req, res) => {
    try {
        // Check if a file is provided
        if (!req.files || !req.files.file) {
            logger.warn("No file uploaded in request");
            return res.status(400).json({ message: "No file uploaded" });
        }

        const file = req.files.file;

        // Read the Excel file
        const workbook = xlsx.read(file.data, { type: "buffer" });
        const sheets = workbook.SheetNames;

        if (sheets.length === 0) {
            logger.warn("Uploaded Excel file contains no sheets");
            return res.status(400).json({ message: "The Excel file contains no sheets" });
        }

        let allData = [];

        // Process all sheets
        sheets.forEach((sheetName) => {
            const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
            sheetData.forEach((row) => {
                // Ensure all values are strings
                const stringifiedRow = {};
                Object.keys(row).forEach((key) => {
                    if (key === "prerequisites" || key === "certificationRequirements") {
                        try {
                            stringifiedRow[key] = JSON.parse(row[key] || "[]");
                        } catch {
                            stringifiedRow[key] = [];
                        }
                    } else {
                        stringifiedRow[key] = row[key]?.toString().trim();
                    }
                });
                allData.push(stringifiedRow);
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
            logger.warn("Validation errors in uploaded Excel file", { errors });
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
        logger.error("Error processing Excel file", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
