const prisma = require("../config/database");


const generateRecommendation = async ({
    userId,
    courseId
}) => {

    const weakConcepts =
        await prisma.conceptMastery.findMany({
            where: {
                userId,
                courseId,
                masteryScore: {
                    lt: 70
                }
            },

            orderBy: {
                masteryScore: "asc"
            }
        });

    if (weakConcepts.length === 0) {

        return {
            recommendation: null,
            message:
                "No weak concepts found. Continue to the next course section."
        };
    }

    /*
        Start with the weakest concept.
    */
    const targetConcept =
        weakConcepts[0];

    /*
        Find lessons associated with the concept.
    */
    const lessons =
        await prisma.lessonConcept.findMany({
            where: {
                conceptId: targetConcept.conceptId
            },

            include: {
                lesson: {
                    include: {
                        module: true
                    }
                }
            }
        });

    if (lessons.length === 0) {

        return {
            recommendation: null,
            message:
                "No lesson found for the weak concept."
        };
    }

    /*
        Prefer the earliest lesson in the course
        that teaches the weak concept.
    */
    const selectedLesson =
        lessons
            .sort(
                (a, b) =>
                    a.lesson.module.position -
                    b.lesson.module.position ||
                    a.lesson.position -
                    b.lesson.position
            )[0];

    const priority =
        100 - targetConcept.masteryScore;

    const reason =
        `Your current mastery of this concept is ` +
        `${targetConcept.masteryScore.toFixed(1)}%. ` +
        `Reviewing this lesson will strengthen a weak area.`;

    const recommendation =
        await prisma.learningRecommendation.create({
            data: {
                userId,
                courseId,

                conceptId:
                    targetConcept.conceptId,

                lessonId:
                    selectedLesson.lesson.id,

                reason,

                priority
            }
        });

    return {
        recommendation,
        lesson: selectedLesson.lesson,
        mastery: targetConcept
    };
};


module.exports = {
    generateRecommendation
};