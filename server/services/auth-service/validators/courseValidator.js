const Joi = require('joi');

const courseValidationSchema = Joi.object({
    crn: Joi.number().integer().required().messages({
        "number.base": "CRN must be a number.",
        "number.integer": "CRN must be an integer.",
        "any.required": "CRN is required."
    }),
    subject: Joi.string().valid("CS", "CEG").required().messages({
        "any.only": "Subject must be either CS or CEG.",
        "any.required": "Subject is required."
    }),
    course: Joi.string().regex(/^[0-9]{4}$/).required().messages({
        "string.pattern.base": "Course number must be a 4-digit number.",
        "any.required": "Course is required."
    }),
    section: Joi.string().required().messages({
        "any.required": "Section is required."
    }),
    campus: Joi.string().valid("Dayton", "Lake").required().messages({
        "any.only": "Campus must be either Dayton or Lake.",
        "any.required": "Campus is required."
    }),
    semester: Joi.string().valid("spring", "summer", "fall").required().messages({
        "any.only": "Semester must be one of spring, summer, or fall.",
        "any.required": "Semester is required."
    }),
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required().messages({
        "number.base": "Year must be a number.",
        "number.min": "Year must be at least 1900.",
        "number.max": `Year cannot exceed ${new Date().getFullYear() + 1}.`,
        "any.required": "Year is required."
    }),
    level: Joi.string().valid("Graduate", "Undergraduate").required().messages({
        "any.only": "Level must be either Graduate or Undergraduate.",
        "any.required": "Level is required."
    }),
    title: Joi.string().required().messages({
        "any.required": "Title is required."
    }),
    description: Joi.string().optional(),
    credits: Joi.number().integer().min(1).max(5).required().messages({
        "number.base": "Credits must be a number.",
        "number.integer": "Credits must be an integer.",
        "number.min": "Credits must be at least 1.",
        "number.max": "Credits cannot exceed 5.",
        "any.required": "Credits are required."
    }),
    days: Joi.string().required().messages({
        "any.required": "Days are required."
    }),
    time: Joi.string().required().messages({
        "any.required": "Time is required."
    }),
    prerequisites: Joi.array().items(Joi.string().regex(/^[0-9]{4}$/)).messages({
        "string.pattern.base": "Each prerequisite must be a valid 4-digit course number."
    }),
    category: Joi.string().valid("Web Development", "AI", "Big Data", "Cybersecurity").required().messages({
        "any.only": "Category must be one of Web Development, AI, Big Data, or Cybersecurity.",
        "any.required": "Category is required."
    }),
    certificationRequirements: Joi.array().items(Joi.string().valid("AI Certification", "Big Data", "Cybersecurity")).messages({
        "any.only": "Certification requirement must be valid."
    }),
    sectionCapacity: Joi.number().integer().min(1).required().messages({
        "number.base": "Section capacity must be a number.",
        "number.min": "Section capacity must be at least 1.",
        "any.required": "Section capacity is required."
    }),
    sectionActual: Joi.number().integer().min(0).required().messages({
        "number.base": "Section actual must be a number.",
        "number.min": "Section actual cannot be negative.",
        "any.required": "Section actual is required."
    }),
    sectionRemaining: Joi.number().integer().required().messages({
        "number.base": "Section remaining must be a number.",
        "any.required": "Section remaining is required."
    }),
    waitlistCapacity: Joi.number().integer().min(0).required().messages({
        "number.base": "Waitlist capacity must be a number.",
        "number.min": "Waitlist capacity cannot be negative.",
        "any.required": "Waitlist capacity is required."
    }),
    waitlistActual: Joi.number().integer().min(0).required().messages({
        "number.base": "Waitlist actual must be a number.",
        "number.min": "Waitlist actual cannot be negative.",
        "any.required": "Waitlist actual is required."
    }),
    waitlistRemaining: Joi.number().integer().min(0).required().messages({
        "number.base": "Waitlist remaining must be a number.",
        "number.min": "Waitlist remaining cannot be negative.",
        "any.required": "Waitlist remaining is required."
    }),
    crosslistCapacity: Joi.number().integer().min(0).optional(),
    crosslistActual: Joi.number().integer().min(0).optional(),
    crosslistRemaining: Joi.number().integer().min(0).optional(),
    instructor: Joi.string().required().messages({
        "any.required": "Instructor is required."
    }),
    duration: Joi.string().required().messages({
        "any.required": "Duration is required."
    }),
    location: Joi.string().optional(),
    attribute: Joi.string().optional(),
    restrictions: Joi.string().optional(),
    status: Joi.string().valid("open", "closed").required().messages({
        "any.only": "Status must be either open or closed.",
        "any.required": "Status is required."
    })
});

module.exports = { courseValidationSchema };
