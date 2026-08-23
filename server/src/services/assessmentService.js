const prisma = require("../config/database");

const {
    updateConceptMastery
} = require("./adaptiveLearningService");


const createAssessment = async ({
    courseId,
    lessonId,
    title,
    description,
    questions
}) => {

    if (!courseId) {
        throw new Error("Course ID is required");
    }

    if (!title) {
        throw new Error("Assessment title is required");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("At least one question is required");
    }

    return await prisma.assessment.create({
        data: {
            courseId,
            lessonId: lessonId || null,
            title,
            description: description || null,
            questions
        }
    });
};


const getAssessment = async (assessmentId) => {

    const assessment = await prisma.assessment.findUnique({
        where: {
            id: assessmentId
        }
    });

    if (!assessment) {
        throw new Error("Assessment not found");
    }

    return assessment;
};


const submitAssessment = async ({
    assessmentId,
    userId,
    answers
}) => {

    if (!Array.isArray(answers) || answers.length === 0) {
        throw new Error("Answers are required");
    }

    const assessment = await prisma.assessment.findUnique({
        where: {
            id: assessmentId
        }
    });

    if (!assessment) {
        throw new Error("Assessment not found");
    }

    const questions = Array.isArray(assessment.questions)
        ? assessment.questions
        : [];

    if (questions.length === 0) {
        throw new Error("Assessment contains no questions");
    }

    let correctAnswers = 0;

    const processedAnswers = answers.map((answer) => {

        const question = questions.find(
            (question) =>
                question.id === answer.questionId
        );

        if (!question) {
            return {
                questionId: answer.questionId,
                answer: answer.answer,
                conceptId: null,
                correct: false
            };
        }

        const correct =
            answer.answer === question.correctAnswer;

        if (correct) {
            correctAnswers++;
        }

        return {
            questionId: answer.questionId,
            answer: answer.answer,
            conceptId: question.conceptId || null,
            correct
        };
    });


    const totalQuestions = questions.length;

    const score =
        (correctAnswers / totalQuestions) * 100;


    /*
        Save the assessment attempt and update
        concept mastery as part of the same
        database transaction.
    */
    const result = await prisma.$transaction(
        async (tx) => {

            const attempt =
                await tx.assessmentAttempt.create({
                    data: {
                        assessmentId,
                        userId,
                        courseId: assessment.courseId,

                        score,

                        totalQuestions,

                        correctAnswers,

                        answers: processedAnswers
                    }
                });


            /*
                Update mastery using the same transaction
                so assessment progress and learner mastery
                remain consistent.
            */
            for (const answer of processedAnswers) {

                if (!answer.conceptId) {
                    continue;
                }

                const existing =
                    await tx.conceptMastery.findUnique({
                        where: {
                            userId_courseId_conceptId: {
                                userId,
                                courseId: assessment.courseId,
                                conceptId: answer.conceptId
                            }
                        }
                    });


                const latestScore =
                    answer.correct ? 100 : 0;


                let newMastery;

                if (!existing) {

                    newMastery = latestScore;

                } else {

                    const learningRate = 0.35;

                    newMastery =
                        existing.masteryScore *
                        (1 - learningRate) +
                        latestScore *
                        learningRate;
                }


                let status;

                if (newMastery >= 85) {
                    status = "MASTERED";
                } else if (newMastery >= 70) {
                    status = "STRONG";
                } else if (newMastery >= 50) {
                    status = "DEVELOPING";
                } else {
                    status = "WEAK";
                }


                if (!existing) {

                    await tx.conceptMastery.create({
                        data: {
                            userId,
                            courseId: assessment.courseId,
                            conceptId: answer.conceptId,

                            masteryScore: newMastery,

                            attempts: 1,

                            correctAnswers:
                                answer.correct ? 1 : 0,

                            totalAnswers: 1,

                            lastScore: latestScore,

                            lastAttemptAt: new Date(),

                            status
                        }
                    });

                } else {

                    await tx.conceptMastery.update({
                        where: {
                            id: existing.id
                        },

                        data: {
                            masteryScore: newMastery,

                            attempts:
                                existing.attempts + 1,

                            correctAnswers:
                                existing.correctAnswers +
                                (answer.correct ? 1 : 0),

                            totalAnswers:
                                existing.totalAnswers + 1,

                            lastScore: latestScore,

                            lastAttemptAt: new Date(),

                            status
                        }
                    });
                }
            }


            return attempt;
        }
    );


    return {
        attempt: result,
        score,
        totalQuestions,
        correctAnswers,
        processedAnswers
    };
};


module.exports = {
    createAssessment,
    getAssessment,
    submitAssessment
};