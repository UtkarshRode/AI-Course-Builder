const prisma = require("../config/database");


const createModule = async (req, res) => {
    try {
        const { courseId } = req.params;
        const {
            title,
            description,
            position
        } = req.body;

        if (!title || position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title and position are required"
            });
        }

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

        if (
            course.creatorId !== req.user.id &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot modify this course"
            });
        }

        const module = await prisma.module.create({
            data: {
                title: title.trim(),
                description: description || null,
                position: Number(position),
                courseId
            }
        });

        res.status(201).json({
            success: true,
            module
        });

    } catch (error) {
        console.error("Create module error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create module"
        });
    }
};


const createLesson = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const {
            title,
            description,
            content,
            position,
            type,
            estimatedMinutes
        } = req.body;

        if (!title || position === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title and position are required"
            });
        }

        const module = await prisma.module.findUnique({
            where: {
                id: moduleId
            },

            include: {
                course: true
            }
        });

        if (!module) {
            return res.status(404).json({
                success: false,
                message: "Module not found"
            });
        }

        if (
            module.course.creatorId !== req.user.id &&
            req.user.role !== "ADMIN"
        ) {
            return res.status(403).json({
                success: false,
                message: "You cannot modify this course"
            });
        }

        const lesson = await prisma.lesson.create({
            data: {
                title: title.trim(),
                description: description || null,
                content: content || null,
                position: Number(position),
                type: type || "THEORY",
                estimatedMinutes: estimatedMinutes
                    ? Number(estimatedMinutes)
                    : null,
                moduleId
            }
        });

        res.status(201).json({
            success: true,
            lesson
        });

    } catch (error) {
        console.error("Create lesson error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create lesson"
        });
    }
};


module.exports = {
    createModule,
    createLesson
};