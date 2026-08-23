const express = require("express");

const {
    getMastery,
    getWeakAreas,
    getNextRecommendation
} = require("../controllers/adaptiveController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();


router.get(
    "/courses/:courseId/mastery",
    authenticate,
    getMastery
);


router.get(
    "/courses/:courseId/weak-areas",
    authenticate,
    getWeakAreas
);


router.get(
    "/courses/:courseId/recommendation",
    authenticate,
    getNextRecommendation
);


module.exports = router;