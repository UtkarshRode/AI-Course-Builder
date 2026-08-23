const express = require("express");

const {
    startLessonController,
    updateProgressController,
    getProgressController
} = require("../controllers/progressController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();


router.post(
    "/courses/:courseId/lessons/:lessonId/start",
    authenticate,
    startLessonController
);


router.patch(
    "/courses/:courseId/lessons/:lessonId",
    authenticate,
    updateProgressController
);


router.get(
    "/courses/:courseId",
    authenticate,
    getProgressController
);


module.exports = router;