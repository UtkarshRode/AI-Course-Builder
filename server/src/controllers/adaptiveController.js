const {
    updateConceptMastery,
    getWeakConcepts
} = require("../services/adaptiveLearningService");

const {
    generateRecommendation
} = require("../services/recommendationService");


const getMastery = async (req, res) => {

    try {

        const {
            courseId
        } = req.params;

        const mastery =
            await require("../config/database")
                .conceptMastery.findMany({
                    where: {
                        userId: req.user.id,
                        courseId
                    },

                    orderBy: {
                        masteryScore: "asc"
                    }
                });

        res.status(200).json({
            success: true,
            mastery
        });

    } catch (error) {

        console.error(
            "Get mastery error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch concept mastery"
        });
    }
};


const getWeakAreas = async (req, res) => {

    try {

        const {
            courseId
        } = req.params;

        const weakConcepts =
            await getWeakConcepts({
                userId: req.user.id,
                courseId
            });

        res.status(200).json({
            success: true,
            weakConcepts
        });

    } catch (error) {

        console.error(
            "Weak concepts error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch weak concepts"
        });
    }
};


const getNextRecommendation = async (req, res) => {

    try {

        const {
            courseId
        } = req.params;

        const result =
            await generateRecommendation({
                userId: req.user.id,
                courseId
            });

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {

        console.error(
            "Recommendation error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to generate recommendation"
        });
    }
};


module.exports = {
    getMastery,
    getWeakAreas,
    getNextRecommendation
};