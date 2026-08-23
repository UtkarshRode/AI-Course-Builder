const express = require("express");

const {
    createCourse,
    getCourses,
    getCourseById,
    publishCourse
} = require("../controllers/courseController");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("INSTRUCTOR", "ADMIN"),
    createCourse
);

router.get("/", getCourses);

router.get("/:id", getCourseById);

router.patch(
    "/:id/publish",
    authenticate,
    authorize("INSTRUCTOR", "ADMIN"),
    publishCourse
);

module.exports = router;