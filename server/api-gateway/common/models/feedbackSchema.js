const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Optimized for queries
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true, // Optimized for queries
    },
    feedback: {
      type: String,
      required: false, // Feedback is optional
      maxlength: 1000, // Limit feedback length to 1000 characters
    },
    createdDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    updatedDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false, // Disable automatic timestamps since we have custom fields
  }
);

// Ensure unique feedback per user and course
feedbackSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
