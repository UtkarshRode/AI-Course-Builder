const express = require("express");

const {
    createConcept,
    addPrerequisite,
    getConceptGraph
} = require("../controllers/conceptController");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
    "/",
    authenticate,
    authorize("INSTRUCTOR", "ADMIN"),
    createConcept
);

router.post(
    "/:conceptId/prerequisites",
    authenticate,
    authorize("INSTRUCTOR", "ADMIN"),
    addPrerequisite
);

router.get(
    "/graph",
    authenticate,
    getConceptGraph
);

module.exports = router;