const express = require("express");

const {
    generateAssessmentForLesson,
    fetchAssessment,
    submitAssessmentAttempt
} = require("../controllers/assessmentController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();


router.post(
    "/lessons/:lessonId/generate",
    authenticate,
    generateAssessmentForLesson
);


router.get(
    "/:assessmentId",
    authenticate,
    fetchAssessment
);


router.post(
    "/:assessmentId/submit",
    authenticate,
    submitAssessmentAttempt
);


module.exports = router;