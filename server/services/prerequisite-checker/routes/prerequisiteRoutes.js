const express = require('express');
const {checkPrerequisites} = require('../controllers/prerequisiteController');

const router = express.Router();

// Check prerequisites for a course
router.get('/prerequisite-check/:courseId', checkPrerequisites);

module.exports = router;
