const prisma = require("../config/database");

const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            difficulty,
            estimatedHours
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Course title is required"
            });
        }

        const course = await prisma.course.create({
            data: {
                title: title.trim(),
                description: description || null,
                difficulty: difficulty || "BEGINNER",
                estimatedHours: estimatedHours
                    ? Number(estimatedHours)
                    : null,
                creatorId: req.user.id
            }
        });

        res.status(201).json({
            success: true,
            course
        });

    } catch (error) {
        console.error("Create course error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create course"
        });
    }
};


const getCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            where: {
                status: "PUBLISHED"
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: {
                    select: {
                        modules: true,
                        enrollments: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json({
            success: true,
            courses
        });

    } catch (error) {
        console.error("Get courses error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch courses"
        });
    }
};


const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await prisma.course.findUnique({
            where: {
                id
            },

            include: {
                creator: {
                    select: {
                        id: true,
                        name: true
                    }
                },

                modules: {
                    orderBy: {
                        position: "asc"
                    },

                    include: {
                        lessons: {
                            orderBy: {
                                position: "asc"
                            },

                            include: {
                                concepts: {
                                    include: {
                                        concept: true
                                    }
                                }
                            }
                        }
                    }
                },

                concepts: {
                    include: {
                        concept: {
                            include: {
                                prerequisites: {
                                    include: {
                                        prerequisite: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.status(200).json({
            success: true,
            course
        });

    } catch (error) {
        console.error("Get course error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch course"
        });
    }
};


const publishCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await prisma.course.findUnique({
            where: {
                id
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
                message: "You cannot publish this course"
            });
        }

        const updatedCourse = await prisma.course.update({
            where: {
                id
            },

            data: {
                status: "PUBLISHED"
            }
        });

        res.status(200).json({
            success: true,
            course: updatedCourse
        });

    } catch (error) {
        console.error("Publish course error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to publish course"
        });
    }
};


module.exports = {
    createCourse,
    getCourses,
    getCourseById,
    publishCourse
};