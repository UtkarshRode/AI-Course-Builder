const prisma = require("../config/database");

const MASTERY_THRESHOLD = 70;


/*
    Calculate mastery using previous performance
    and the latest assessment score.
*/
const calculateMastery = (
    previousMastery,
    previousAttempts,
    latestScore
) => {

    if (previousAttempts === 0) {
        return latestScore;
    }

    const learningRate = 0.35;

    return (
        previousMastery * (1 - learningRate) +
        latestScore * learningRate
    );
};


/*
    Convert mastery score into a learning status.
*/
const getMasteryStatus = (score) => {

    if (score >= 85) {
        return "MASTERED";
    }

    if (score >= 70) {
        return "STRONG";
    }

    if (score >= 50) {
        return "DEVELOPING";
    }

    return "WEAK";
};


/*
    Update mastery for concepts tested by an assessment.
*/
const updateConceptMastery = async ({
    userId,
    courseId,
    answers
}) => {

    for (const answer of answers) {

        const {
            conceptId,
            correct
        } = answer;

        if (!conceptId) {
            continue;
        }

        const existing =
            await prisma.conceptMastery.findUnique({
                where: {
                    userId_courseId_conceptId: {
                        userId,
                        courseId,
                        conceptId
                    }
                }
            });

        const latestScore = correct ? 100 : 0;

        if (!existing) {

            const status =
                getMasteryStatus(latestScore);

            await prisma.conceptMastery.create({
                data: {
                    userId,
                    courseId,
                    conceptId,

                    masteryScore: latestScore,

                    attempts: 1,

                    correctAnswers:
                        correct ? 1 : 0,

                    totalAnswers: 1,

                    lastScore: latestScore,

                    lastAttemptAt: new Date(),

                    status
                }
            });

            continue;
        }

        const newMastery =
            calculateMastery(
                existing.masteryScore,
                existing.attempts,
                latestScore
            );

        const newAttempts =
            existing.attempts + 1;

        const newCorrectAnswers =
            existing.correctAnswers +
            (correct ? 1 : 0);

        const newTotalAnswers =
            existing.totalAnswers + 1;

        await prisma.conceptMastery.update({
            where: {
                id: existing.id
            },

            data: {
                masteryScore: newMastery,

                attempts: newAttempts,

                correctAnswers:
                    newCorrectAnswers,

                totalAnswers:
                    newTotalAnswers,

                lastScore: latestScore,

                lastAttemptAt: new Date(),

                status:
                    getMasteryStatus(newMastery)
            }
        });
    }
};


/*
    Find concepts where the learner is weak.
*/
const getWeakConcepts = async ({
    userId,
    courseId
}) => {

    return await prisma.conceptMastery.findMany({
        where: {
            userId,
            courseId,
            masteryScore: {
                lt: MASTERY_THRESHOLD
            }
        },

        orderBy: {
            masteryScore: "asc"
        }
    });
};


module.exports = {
    calculateMastery,
    getMasteryStatus,
    updateConceptMastery,
    getWeakConcepts
};