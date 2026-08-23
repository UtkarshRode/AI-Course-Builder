const {
    getDashboard
} = require("../services/dashboardService");


const getDashboardController = async (
    req,
    res
) => {

    try {

        const {
            courseId
        } = req.params;


        const dashboard =
            await getDashboard({
                userId: req.user.id,
                courseId
            });


        res.status(200).json({
            success: true,
            dashboard
        });

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to load dashboard"
        });
    }
};


module.exports = {
    getDashboardController
};