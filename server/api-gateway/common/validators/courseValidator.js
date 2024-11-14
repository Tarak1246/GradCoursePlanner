const Joi = require('joi');

const courseValidationSchema = Joi.object({
    crn: Joi.string().required().messages({
        "string.base": "CRN must be a string.",
        "any.required": "CRN is required."
    }),
    subject: Joi.string().valid("CS", "CEG").required().messages({
        "any.only": "Subject must be either CS or CEG.",
        "any.required": "Subject is required."
    }),
    course: Joi.string().required().messages({
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
    year: Joi.string().required().messages({
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
    credits: Joi.string().required().messages({
        "any.required": "Credits are required."
    }),
    days: Joi.string().required().messages({
        "any.required": "Days are required."
    }),
    time: Joi.string().required().messages({
        "any.required": "Time is required."
    }),
    prerequisites: Joi.array().items(Joi.string()).optional().messages({
        "string.base": "Each prerequisite must be a string."
    }),
    category: Joi.array().items(Joi.string().valid("Web Development", "AI", "Big Data", "Cybersecurity")).required().messages({
        "any.only": "Category must be one of Web Development, AI, Big Data, or Cybersecurity.",
        "any.required": "Category is required."
    }),
    certificationRequirements: Joi.array().items(
        Joi.string().valid("AI Certification", "Big Data", "Cybersecurity")
    ).optional().messages({
        "any.only": "Certification requirement must be valid."
    }),
    sectionCapacity: Joi.string().required().messages({
        "any.required": "Section capacity is required."
    }),
    sectionActual: Joi.string().required().messages({
        "any.required": "Section actual is required."
    }),
    sectionRemaining: Joi.string().required().messages({
        "any.required": "Section remaining is required."
    }),
    waitlistCapacity: Joi.string().required().messages({
        "any.required": "Waitlist capacity is required."
    }),
    waitlistActual: Joi.string().required().messages({
        "any.required": "Waitlist actual is required."
    }),
    waitlistRemaining: Joi.string().required().messages({
        "any.required": "Waitlist remaining is required."
    }),
    crosslistCapacity: Joi.string().allow("").optional(),
    crosslistActual: Joi.string().allow("").optional(),
    crosslistRemaining: Joi.string().allow("").optional(),
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
