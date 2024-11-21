const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  requiredCourses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    },
  ], // List of courses required for the certificate
});

module.exports = mongoose.model('Certificate', certificateSchema);