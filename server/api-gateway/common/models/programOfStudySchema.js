const mongoose = require("mongoose");

const programOfStudySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
      unique: true, // Each user can have only one program of study
    },
    courses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        crn: {
          type: String,
          required: true,
        },
        course:{
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        subject: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["Planned", "Completed", "Dropped"],
          default: "Planned",
        },
        grade: {
          type: String,
          enum: ["A", "B", "C", "D", "F", "P", "NP"],
          required: function () {
            return this.status === "Completed";
          },
        },
        marks: {
          type: Number,
          min: 0,
        },
        totalMarks: {
          type: Number,
          min: 0,
        },
        semesterTaken: {
          type: String,
          enum: ["spring", "summer", "fall"],
          required: true,
        },
        yearTaken: {
          type: String,
          required: true,
        },
        credits: {
          type: Number,
          required: true,
        },
        days: {
          type: String,
          required: true,
        },
        time: {
          type: String,
          required: true,
        },
        attribute: {
          type: String,
          required: true,
        },
      },
    ],
    completionStatus: {
      type: String,
      enum: ["In Progress", "Completed", "Not Started"],
      default: "In Progress",
    },
    gpa: {
      type: Number,
      min: 0,
      max: 4,
      default: 0,
    },
    firstSemester: {
      semester: {
        type: String,
      },
      year: {
        type: String,
      },
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
    defaultPrequisites: {
      type: Number,
      default: 0, // Tracks credits from default prerequisites
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Index userId and courses for faster queries
programOfStudySchema.index({ userId: 1, "courses.courseId": 1 });

module.exports = mongoose.model("ProgramOfStudy", programOfStudySchema);
