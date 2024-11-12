const express = require('express');
const passport = require('passport');
const { addCourse, modifyCourse } = require('../controllers/courseController.js');
const { verifyAdmin } = require('../middlewares/verifyAdmin.js');

const router = express.Router();

// Add a new course
router.post('/add', passport.authenticate('jwt', { session: false }), verifyAdmin, addCourse);

// Modify an existing course
router.put('/modify/:id', passport.authenticate('jwt', { session: false }), verifyAdmin, modifyCourse);

module.exports = router;
