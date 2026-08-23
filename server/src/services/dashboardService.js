const prisma = require("../config/database");

const {
    getCourseProgress
} = require("./progressService");


const getDashboard = async ({
    userId,
    courseId
}) => {

    const progress =
        await getCourseProgress({
            userId,
            courseId
        });


    const mastery =
        await prisma.conceptMastery.findMany({
            where: {
                userId,
                courseId
            },

            orderBy: {
                masteryScore: "asc"
            }
        });


    const weakConcepts =
        mastery.filter(
            item =>
                item.masteryScore < 70
        );


    const masteredConcepts =
        mastery.filter(
            item =>
                item.masteryScore >= 85
        );


    const attempts =
        await prisma.assessmentAttempt.findMany({
            where: {
                userId,
                courseId
            },

            orderBy: {
                completedAt: "desc"
            },

            take: 10
        });


    const recommendations =
        await prisma.learningRecommendation.findMany({
            where: {
                userId,
                courseId,
                status: "PENDING"
            },

            orderBy: {
                priority: "desc"
            },

            take: 5
        });


    const averageAssessmentScore =
        attempts.length === 0
            ? 0
            : attempts.reduce(
                (sum, attempt) =>
                    sum + attempt.score,
                0
            ) / attempts.length;


    return {

        course: progress.course,

        progress: {
            overall:
                progress.overallProgress,

            totalLessons:
                progress.totalLessons,

            completedLessons:
                progress.completedLessons,

            remainingLessons:
                progress.remainingLessons
        },

        modules:
            progress.modules,

        mastery: {

            conceptsTracked:
                mastery.length,

            mastered:
                masteredConcepts.length,

            weak:
                weakConcepts.length,

            weakConcepts,

            all:
                mastery
        },

        assessments: {

            attempts:
                attempts.length,

            averageScore:
                Number(
                    averageAssessmentScore.toFixed(2)
                ),

            recent:
                attempts
        },

        recommendations
    };
};


module.exports = {
    getDashboard
};