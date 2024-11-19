const express = require("express");
const { checkCertificates } = require("../controllers/certificateController");

const router = express.Router();

// Check certificates for a course
router.get("/certificate-check/:courseId", checkCertificates);

module.exports = router;
