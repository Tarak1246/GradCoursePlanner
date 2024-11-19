const mongoose = require('mongoose');

const programOfStudySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Index for faster queries
    },
    courses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true, // Every course entry must have a reference
        },
        status: {
          type: String,
          enum: ['Planned', 'Completed', 'Dropped'],
          default: 'Planned', // Initially set to 'Planned'
        },
        grade: {
          type: String,
          enum: ['A', 'B', 'C', 'D', 'F', 'P', 'NP'], // Support various grading systems
          required: function () {
            return this.status === 'Completed';
          }, // Grade is only required for completed courses
        },
        semesterTaken: {
          type: String,
          enum: ['spring', 'summer', 'fall'],
          required: true,
        },
        yearTaken: {
          type: Number,
          required: true,
        },
        credits: {
          type: Number,
          required: true,
        },
      },
    ],
    completionStatus: {
      type: String,
      enum: ['In Progress', 'Completed', 'Not Started'],
      default: 'In Progress',
    },
    totalCredits: {
      type: Number,
      default: 0, // Tracks total credits
    },
    coreCredits: {
      type: Number,
      default: 0, // Tracks credits from core courses
    },
    csCredits: {
      type: Number,
      default: 0, // Tracks CS-specific credits
    },
    cegCredits: {
      type: Number,
      default: 0, // Tracks CEG-specific credits
    },
    upperLevelCredits: {
      type: Number,
      default: 0, // Tracks credits at the 7000/8000 levels
    },
    lowerLevelCredits: {
      type: Number,
      default: 0, // Tracks credits at the 6000 level
    },
    independentStudyCredits: {
      type: Number,
      default: 0, // Tracks credits from independent study courses
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Index userId and courses for faster queries
programOfStudySchema.index({ userId: 1, 'courses.courseId': 1 });

module.exports = mongoose.model('ProgramOfStudy', programOfStudySchema);
