const {
    generateLessonAssessment
} = require("../services/assessmentGenerationService");

const {
    getAssessment,
    submitAssessment
} = require("../services/assessmentService");


const generateAssessmentForLesson = async (req, res) => {

    try {

        const {
            lessonId
        } = req.params;


        const assessment =
            await generateLessonAssessment({
                lessonId,
                userId: req.user.id
            });


        res.status(201).json({
            success: true,
            message:
                "Assessment generated successfully",
            assessment
        });

    } catch (error) {

        console.error(
            "Assessment generation error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to generate assessment"
        });
    }
};


const fetchAssessment = async (req, res) => {

    try {

        const {
            assessmentId
        } = req.params;


        const assessment =
            await getAssessment(
                assessmentId
            );


        /*
            Never expose correct answers
            when learner fetches an assessment.
        */
        const questions =
            assessment.questions.map(
                question => {

                    const {
                        correctAnswer,
                        explanation,
                        ...safeQuestion
                    } = question;

                    return safeQuestion;
                }
            );


        res.status(200).json({
            success: true,

            assessment: {
                id: assessment.id,
                title: assessment.title,
                description:
                    assessment.description,
                questions
            }
        });

    } catch (error) {

        console.error(
            "Fetch assessment error:",
            error
        );

        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};


const submitAssessmentAttempt = async (req, res) => {

    try {

        const {
            assessmentId
        } = req.params;


        const {
            answers
        } = req.body;


        const result =
            await submitAssessment({
                assessmentId,

                userId:
                    req.user.id,

                answers
            });


        res.status(200).json({
            success: true,

            message:
                "Assessment submitted successfully",

            result
        });

    } catch (error) {

        console.error(
            "Assessment submission error:",
            error
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    generateAssessmentForLesson,
    fetchAssessment,
    submitAssessmentAttempt
};