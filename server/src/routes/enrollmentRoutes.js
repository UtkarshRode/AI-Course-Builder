const express = require("express");

const {
    getEnrollment,
    enrollInCourse,
    completeLesson
} = require("../controllers/enrollmentController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();


router.get(
    "/:courseId",
    authenticate,
    getEnrollment
);


router.post(
    "/:courseId",
    authenticate,
    enrollInCourse
);


router.post(
    "/:enrollmentId/lessons/:lessonId/complete",
    authenticate,
    completeLesson
);


module.exports = router;