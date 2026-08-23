const prisma = require("../config/database");


const getEnrollment = async ({
    userId,
    courseId
}) => {

    const enrollment =
        await prisma.enrollment.findFirst({
            where: {
                userId,
                courseId
            }
        });

    if (!enrollment) {
        throw new Error(
            "User is not enrolled in this course"
        );
    }

    return enrollment;
};


/*
 * Start a lesson
 */
const startLesson = async ({
    userId,
    courseId,
    lessonId
}) => {

    const enrollment =
        await getEnrollment({
            userId,
            courseId
        });


    const existing =
        await prisma.lessonProgress.findUnique({
            where: {
                enrollmentId_lessonId: {
                    enrollmentId:
                        enrollment.id,

                    lessonId
                }
            }
        });


    if (existing) {

        return await prisma.lessonProgress.update({
            where: {
                id: existing.id
            },

            data: {
                lastAccessed: new Date()
            }
        });
    }


    return await prisma.lessonProgress.create({
        data: {
            enrollmentId:
                enrollment.id,

            lessonId,

            completed: false
        }
    });
};


/*
 * Update lesson progress
 */
const updateLessonProgress = async ({
    userId,
    courseId,
    lessonId,
    progress
}) => {

    const enrollment =
        await getEnrollment({
            userId,
            courseId
        });


    const existing =
        await prisma.lessonProgress.findUnique({
            where: {
                enrollmentId_lessonId: {
                    enrollmentId:
                        enrollment.id,

                    lessonId
                }
            }
        });


    if (!existing) {

        throw new Error(
            "Lesson progress not found. Start the lesson first."
        );
    }


    const safeProgress =
        Math.max(
            0,
            Math.min(
                100,
                Number(progress)
            )
        );


    const completed =
        safeProgress >= 100;


    return await prisma.lessonProgress.update({
        where: {
            id: existing.id
        },

        data: {
            completed,

            completedAt:
                completed
                    ? existing.completedAt ||
                      new Date()
                    : null
        }
    });
};


/*
 * Get complete course progress
 */
const getCourseProgress = async ({
    userId,
    courseId
}) => {

    const enrollment =
        await getEnrollment({
            userId,
            courseId
        });


    const modules =
        await prisma.module.findMany({
            where: {
                courseId
            },

            include: {
                lessons: true
            },

            orderBy: {
                position: "asc"
            }
        });


    const progressRecords =
        await prisma.lessonProgress.findMany({
            where: {
                enrollmentId:
                    enrollment.id
            }
        });


    const progressMap =
        new Map(
            progressRecords.map(
                item => [
                    item.lessonId,
                    item
                ]
            )
        );


    let totalLessons = 0;
    let completedLessons = 0;


    const moduleProgress =
        modules.map(module => {

            const lessons =
                module.lessons.map(
                    lesson => {

                        totalLessons++;


                        const record =
                            progressMap.get(
                                lesson.id
                            );


                        const completed =
                            record
                                ? record.completed
                                : false;


                        if (completed) {
                            completedLessons++;
                        }


                        return {
                            id:
                                lesson.id,

                            title:
                                lesson.title,

                            progress:
                                completed
                                    ? 100
                                    : 0,

                            status:
                                completed
                                    ? "COMPLETED"
                                    : "NOT_STARTED",

                            completed
                        };
                    }
                );


            const moduleTotal =
                lessons.length;


            const moduleCompleted =
                lessons.filter(
                    lesson =>
                        lesson.completed
                ).length;


            const moduleProgressValue =
                moduleTotal === 0
                    ? 0
                    : (
                        moduleCompleted /
                        moduleTotal
                    ) * 100;


            return {
                id:
                    module.id,

                title:
                    module.title,

                progress:
                    Number(
                        moduleProgressValue
                            .toFixed(2)
                    ),

                completedLessons:
                    moduleCompleted,

                totalLessons:
                    moduleTotal,

                lessons
            };
        });


    const overallProgress =
        totalLessons === 0
            ? 0
            : (
                completedLessons /
                totalLessons
            ) * 100;


    return {

        course: {
            id:
                courseId,

            title:
                modules.length > 0
                    ? undefined
                    : undefined
        },

        overallProgress:
            Number(
                overallProgress.toFixed(2)
            ),

        totalLessons,

        completedLessons,

        remainingLessons:
            totalLessons -
            completedLessons,

        modules:
            moduleProgress
    };
};


module.exports = {
    startLesson,
    updateLessonProgress,
    getCourseProgress
};