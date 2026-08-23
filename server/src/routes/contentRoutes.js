const express = require("express");

const {
    createModule,
    createLesson
} = require("../controllers/contentController");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/courses/:courseId/modules",
    authenticate,
    authorize("INSTRUCTOR", "ADMIN"),
    createModule
);

router.post(
    "/modules/:moduleId/lessons",
    authenticate,
    authorize("INSTRUCTOR", "ADMIN"),
    createLesson
);

module.exports = router;