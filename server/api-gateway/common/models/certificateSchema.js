const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  requiredCourses: [
    {
      course : { type: String, ref: 'Course', required: true, unique: true},
      title: { type: String, ref: 'Course', required: true },
      crn: { type: String, ref: 'Course', required: true },
      subject: { type: String, ref: 'Course', required: true, unique: true },
    },
  ], // List of courses required for the certificate
});

module.exports = mongoose.model('Certificate', certificateSchema);