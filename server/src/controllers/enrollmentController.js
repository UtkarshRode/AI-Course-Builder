const prisma = require("../config/database");


const getEnrollment = async (req, res) => {
    try {
        const { courseId } = req.params;

        const enrollment =
            await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.user.id,
                        courseId
                    }
                }
            });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "User is not enrolled in this course"
            });
        }

        res.status(200).json({
            success: true,
            enrollment
        });

    } catch (error) {
        console.error(
            "Get enrollment error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to get enrollment"
        });
    }
};


const enrollInCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await prisma.course.findUnique({
            where: {
                id: courseId
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (course.status !== "PUBLISHED") {
            return res.status(400).json({
                success: false,
                message: "Course is not available for enrollment"
            });
        }

        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId
                }
            }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Already enrolled in this course"
            });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: req.user.id,
                courseId
            }
        });

        res.status(201).json({
            success: true,
            enrollment
        });

    } catch (error) {
        console.error("Enrollment error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to enroll in course"
        });
    }
};


const completeLesson = async (req, res) => {
    try {
        const {
            enrollmentId,
            lessonId
        } = req.params;

        const enrollment = await prisma.enrollment.findUnique({
            where: {
                id: enrollmentId
            }
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: "Enrollment not found"
            });
        }

        if (enrollment.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "This enrollment does not belong to you"
            });
        }

        const lesson = await prisma.lesson.findUnique({
            where: {
                id: lessonId
            }
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: "Lesson not found"
            });
        }

        const progress = await prisma.lessonProgress.upsert({
            where: {
                enrollmentId_lessonId: {
                    enrollmentId,
                    lessonId
                }
            },

            create: {
                enrollmentId,
                lessonId,
                completed: true,
                completedAt: new Date()
            },

            update: {
                completed: true,
                completedAt: new Date()
            }
        });

        res.status(200).json({
            success: true,
            progress
        });

    } catch (error) {
        console.error("Lesson completion error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update lesson progress"
        });
    }
};


module.exports = {
    getEnrollment,
    enrollInCourse,
    completeLesson
};