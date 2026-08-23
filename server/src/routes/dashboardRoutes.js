const express = require("express");

const {
    getDashboardController
} = require("../controllers/dashboardController");

const authenticate =
    require("../middleware/authMiddleware");

const router = express.Router();


router.get(
    "/:courseId",
    authenticate,
    getDashboardController
);


module.exports = router;