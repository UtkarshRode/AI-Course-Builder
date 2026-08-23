const {
    startLesson,
    updateLessonProgress,
    getCourseProgress
} = require("../services/progressService");


const startLessonController = async (
    req,
    res
) => {

    try {

        const {
            courseId,
            lessonId
        } = req.params;


        const progress =
            await startLesson({
                userId: req.user.id,
                courseId,
                lessonId
            });


        res.status(200).json({
            success: true,
            progress
        });

    } catch (error) {

        console.error(
            "Start lesson error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to start lesson"
        });
    }
};


const updateProgressController = async (
    req,
    res
) => {

    try {

        const {
            courseId,
            lessonId
        } = req.params;


        const {
            progress
        } = req.body;


        const result =
            await updateLessonProgress({
                userId: req.user.id,
                courseId,
                lessonId,
                progress
            });


        res.status(200).json({
            success: true,
            progress: result
        });

    } catch (error) {

        console.error(
            "Update progress error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update progress"
        });
    }
};


const getProgressController = async (
    req,
    res
) => {

    try {

        const {
            courseId
        } = req.params;


        const progress =
            await getCourseProgress({
                userId: req.user.id,
                courseId
            });


        res.status(200).json({
            success: true,
            progress
        });

    } catch (error) {

        console.error(
            "Get progress error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch course progress"
        });
    }
};


module.exports = {
    startLessonController,
    updateProgressController,
    getProgressController
};