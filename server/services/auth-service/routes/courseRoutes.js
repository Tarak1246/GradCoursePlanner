const express = require('express');
const passport = require('passport');
const { addOrModifyCourses } = require('../controllers/courseController');
const { verifyAdmin } = require('../middlewares/verifyAdmin');

const router = express.Router();

// Add or Modify Courses in Bulk
router.post('/bulk', passport.authenticate('jwt', { session: false }), verifyAdmin, addOrModifyCourses);

module.exports = router;
