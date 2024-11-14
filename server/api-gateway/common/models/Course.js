const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    crn: { type: String, required: true }, // Course Reference Number (can repeat with unique semester/year combination)
    subject: { type: String, required: true, enum: ["CS", "CEG"] }, // Subject codes
    course: { type: String, required: true, unique: true }, // Unique course number
    section: { type: String, required: true }, // Section number
    campus: { type: String, required: true, enum: ["Dayton", "Lake"] }, // Fixed campus values
    semester: { type: String, required: true, enum: ["spring", "summer", "fall"] }, // Semester values
    year: { type: String, required: true }, // Year of the course
    level: { type: String, required: true, enum: ["Graduate", "Undergraduate"] }, // Course level
    title: { type: String, required: true }, // Course title
    description: { type: String, required: false }, // Optional description
    credits: { type: String, required: true }, // Number of credits
    days: { type: String, required: true }, // Days (e.g., MW)
    time: { type: String, required: true }, // Time (e.g., 04:40 pm-06:00 pm)
    prerequisites: [{ type: String }], // List of course numbers as prerequisites
    category: [{ type: String, enum: ["Web Development", "AI", "Big Data", "Cybersecurity"], required: true }], // Course category
    certificationRequirements: [{ type: String, enum: ["AI Certification", "Big Data", "Cybersecurity"] }], // Certification requirements
    sectionCapacity: { type: String, required: true }, // Total capacity
    sectionActual: { type: String, required: true }, // Enrolled students
    sectionRemaining: { type: String, required: true }, // Remaining seats
    waitlistCapacity: { type: String, required: true }, // Waitlist capacity
    waitlistActual: { type: String, required: true }, // Waitlisted students
    waitlistRemaining: { type: String, required: true }, // Remaining waitlist slots
    crosslistCapacity: { type: String, required: false }, // Crosslist capacity
    crosslistActual: { type: String, required: false }, // Crosslist actual
    crosslistRemaining: { type: String, required: false }, // Crosslist remaining
    instructor: { type: String, required: true }, // Instructor name
    duration: { type: String, required: true }, // Course duration (e.g., 01/13-05/03)
    location: { type: String, required: false }, // Location (optional)
    attribute: { type: String, required: false }, // Attributes (e.g., Face-to-Face)
    restrictions: { type: String, required: false }, // Restrictions (e.g., "See class details")
    status: { type: String, required: true, enum: ["open", "closed"] }, // Status of the course
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

// Compound index to ensure crn, semester, and year combination is unique
courseSchema.index({ crn: 1, semester: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
