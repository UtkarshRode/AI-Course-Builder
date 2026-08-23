const express = require("express");

const {
    createCoursePlan,
    runLearnerAgentController
} = require("../controllers/aiController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();

router.post(
    "/course-plan",
    authenticate,
    createCoursePlan
);

router.post(
    "/learner-agent",
    authenticate,
    runLearnerAgentController
);

module.exports = router;