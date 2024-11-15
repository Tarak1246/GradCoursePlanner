const mongoose = require('mongoose');

const programOfStudySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true, // Add an index for faster queries
        },
        plannedCourses: [
            {
                courseId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Course',
                },
                status: {
                    type: String,
                    enum: ['Planned', 'Completed', 'Dropped'],
                    default: 'Planned',
                },
                grade: {
                    type: String,
                    required: false, // Optional: To store the grade if the course is completed
                },
                completedExternally: {
                    type: Boolean,
                    default: false, // Mark courses completed during prior education
                },
            },
        ],
        registeredCourses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
            },
        ],
        completionStatus: {
            type: String,
            enum: ['In Progress', 'Completed', 'Not Started'],
            default: 'In Progress',
        },
        totalCredits: {
            type: Number,
            default: 0, // Update dynamically as courses are added
        },
        feedback: [
            {
                courseId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Course',
                },
                feedbackText: {
                    type: String,
                },
                rating: {
                    type: Number,
                    min: 1,
                    max: 5,
                },
            },
        ],
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// Index userId for faster queries
programOfStudySchema.index({ userId: 1 });

module.exports = mongoose.model('ProgramOfStudy', programOfStudySchema);
