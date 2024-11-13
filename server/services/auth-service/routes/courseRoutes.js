const express = require('express');
const passport = require('passport');
const { addOrModifyCourses } = require('../controllers/courseController');
const { verifyAdmin } = require('../middlewares/verifyAdmin');
const rateLimiter =  require('../middlewares/rateLimiter');
const router = express.Router();

// Add or Modify Courses in Bulk
router.post('/bulk', passport.authenticate('jwt', { session: false }), verifyAdmin, rateLimiter, addOrModifyCourses);

module.exports = router;