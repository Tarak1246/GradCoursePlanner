const express = require('express');
const {
    checkPrerequisites,
    markPrerequisitesCompleted,
} = require('../controllers/prerequisiteController');

const router = express.Router();

// Check prerequisites for a course
router.get('/prerequisite-check/:courseId', checkPrerequisites);

// Mark prerequisites as completed
router.post('/mark-completed', markPrerequisitesCompleted);

module.exports = router;
