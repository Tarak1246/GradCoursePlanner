const Course = require('../models/Course');
const { courseValidationSchema } = require('../validators/courseValidator');
const logger = require('../utils/logger');

exports.addCourse = async (req, res) => {
    try {
        const { error } = courseValidationSchema.validate(req.body);
        if (error) {
            logger.warn(`Validation error: ${error.details[0].message}`);
            return res.status(400).json({ message: error.details[0].message });
        }

        const existingCourse = await Course.findOne({ crn: req.body.crn, semester: req.body.semester, year: req.body.year });
        if (existingCourse) {
            return res.status(409).json({ message: "Course with this CRN, semester, and year already exists." });
        }

        const newCourse = new Course(req.body);
        await newCourse.save();

        res.status(201).json({ message: "Course added successfully", course: newCourse });
    } catch (error) {
        logger.error(`Error adding course: ${error.message}`);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.modifyCourse = async (req, res) => {
    try {
        const { error } = courseValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const updatedCourse = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found." });
        }

        res.status(200).json({ message: "Course updated successfully", course: updatedCourse });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
